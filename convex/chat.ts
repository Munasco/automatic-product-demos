import { v } from "convex/values";
import { mutation, query, httpAction, internalMutation, internalQuery } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { PersistentTextStreaming, type StreamId } from "@convex-dev/persistent-text-streaming";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

// Initialize the persistent text streaming component
const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

// Create a new stream and assistant message
export const createStream = mutation({
  args: {
    chatId: v.id("chats"),
    model: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a stream using the component
    const streamId = await persistentTextStreaming.createStream(ctx);

    // Create the assistant message with empty content (will be filled by stream)
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: "assistant",
      content: "", // Will be updated as stream progresses
      createdAt: Date.now(),
      streamId,
    });

    // Store the stream metadata for lookup by HTTP action
    await ctx.db.insert("streamMetadata", {
      streamId,
      chatId: args.chatId,
      messageId,
      model: args.model || "gpt-5.1-mini",
      sessionId: args.sessionId,
      createdAt: Date.now(),
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    return { streamId, messageId };
  },
});

// Query to get sessionId for a stream (to check if current session initiated it)
export const getStreamSessionId = query({
  args: {
    streamId: v.string(),
  },
  handler: async (ctx, args) => {
    const metadata = await ctx.db
      .query("streamMetadata")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .first();
    return metadata?.sessionId || null;
  },
});

// Internal query to get stream metadata
export const getStreamMetadata = internalQuery({
  args: {
    streamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("streamMetadata")
      .withIndex("by_stream", (q) => q.eq("streamId", args.streamId))
      .first();
  },
});

// Internal query to get messages for a chat
export const getChatMessages = internalQuery({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

// Get stream body for a single stream
export const getStreamBody = query({
  args: {
    streamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(ctx, args.streamId as StreamId);
  },
});

// Get all active stream bodies for a chat (for non-driver viewers)
export const getActiveStreamBodies = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // Get all messages with streamIds that have empty content (still streaming)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const streamBodies: Record<string, { text: string; status: string }> = {};

    for (const msg of messages) {
      // Only get stream body for messages that are still streaming (empty content)
      if (msg.streamId && !msg.content) {
        try {
          const body = await persistentTextStreaming.getStreamBody(ctx, msg.streamId as StreamId);
          streamBodies[msg._id] = body;
        } catch {
          // Stream might not exist anymore
        }
      }
    }

    return streamBodies;
  },
});

// Internal mutation to update message content from stream
export const updateMessageContent = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

// HTTP action for streaming chat responses
export const streamChat = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    // The useStream hook sends { streamId } in the body
    const body = await request.json();
    const streamId: string = body.streamId;

    if (!streamId) {
      return new Response(
        JSON.stringify({ error: "Missing streamId" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Look up stream metadata to get chat context
    const metadata = await ctx.runQuery(internal.chat.getStreamMetadata, { streamId });
    if (!metadata) {
      return new Response(
        JSON.stringify({ error: "Stream metadata not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get chat messages from database
    const dbMessages = await ctx.runQuery(internal.chat.getChatMessages, { chatId: metadata.chatId });

    // Convert to UIMessage format (exclude the empty assistant message we just created)
    const messages: UIMessage[] = dbMessages
      .filter(m => m._id !== metadata.messageId) // Exclude the placeholder assistant message
      .map(m => ({
        id: m._id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      }));

    const model = metadata.model;

    // Generator function for AI text
    const generateAIResponse = async (
      _ctx: typeof ctx,
      _request: typeof request,
      _streamId: string,
      chunkAppender: (text: string) => Promise<void>
    ) => {
      let fullText = "";

      try {
        const result = streamText({
          model: openai(model),
          system: `You are a helpful AI assistant. Be concise and helpful. Use markdown formatting when appropriate.`,
          messages: convertToModelMessages(messages),
        });

        // Stream the response
        for await (const chunk of result.textStream) {
          fullText += chunk;
          await chunkAppender(chunk);
        }
      } catch (error) {
        console.error("AI generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorText = `[Error: ${errorMessage}]`;
        fullText = fullText || errorText;
        await chunkAppender(errorText);
      }

      // Update the message in database with final content
      await ctx.runMutation(internal.chat.updateMessageContent, {
        messageId: metadata.messageId,
        content: fullText,
      });
    };

    // Use the component's stream method
    const response = await persistentTextStreaming.stream(
      ctx,
      request,
      streamId as StreamId,
      generateAIResponse
    );

    // Set CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    response.headers.set("Vary", "Origin");

    return response;
  } catch (error) {
    console.error("Stream chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to stream chat response" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
