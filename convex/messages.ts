import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

// Get all messages for a chat
export const getAll = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

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
    editVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
      attachments: args.attachments,
      editVersion: args.editVersion,
    });

    // Update chat's updatedAt
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Update a message's content
export const update = mutation({
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

// Delete a message
export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});

// Clear all messages from a chat
export const clearChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});

// Generate title action
export const generateTitle = action({
  args: {
    message: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const { text } = await generateText({
      model: openai(args.model || "gpt-5.1"),
      system: "Generate a very short title (3-6 words) for this chat based on the user's message. No quotes, no punctuation at the end.",
      prompt: args.message,
    });
    return text.trim();
  },
});

// Sync messages from AI SDK (called by HTTP action onFinish)
export const syncMessages = internalMutation({
  args: {
    chatId: v.id("chats"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Get existing messages
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    // Only add new messages (compare by content to avoid duplicates)
    const existingContents = new Set(existing.map(m => m.content));

    for (const msg of args.messages) {
      if (!existingContents.has(msg.content) && msg.content.trim()) {
        await ctx.db.insert("messages", {
          chatId: args.chatId,
          role: msg.role,
          content: msg.content,
          createdAt: Date.now(),
        });
      }
    }

    // Update chat timestamp
    await ctx.db.patch(args.chatId, {
      updatedAt: Date.now(),
    });
  },
});
