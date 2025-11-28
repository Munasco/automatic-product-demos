import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { components } from "./_generated/api";
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import type { StreamId } from "@convex-dev/persistent-text-streaming";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

// Add a message to a chat
export const add = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const now = Date.now();

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      createdAt: now,
      attachments: args.attachments,
    });

    // Update chat's updatedAt and potentially title
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const updates: { updatedAt: number; title?: string } = { updatedAt: now };

    // Update title from first user message if chat is new
    if (messages.length === 1 && args.role === "user") {
      updates.title =
        args.content.length > 50
          ? args.content.slice(0, 50) + "..."
          : args.content;
    }

    await ctx.db.patch(args.chatId, updates);

    return messageId;
  },
});

// Get messages for a chat
export const list = query({
  args: {
    chatId: v.id("chats"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Update the last message content (for streaming)
export const updateContent = mutation({
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

// Create a message with a stream for AI responses
export const createWithStream = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    const now = Date.now();
    
    // Create stream for assistant messages
    const streamId = args.role === "assistant" 
      ? await persistentTextStreaming.createStream(ctx)
      : undefined;

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      createdAt: now,
      streamId,
      attachments: args.attachments,
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, { updatedAt: now });

    return { messageId, streamId };
  },
});

// Get stream body for a message
export const getStreamBody = query({
  args: {
    streamId: v.string(),
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId
    );
  },
});
