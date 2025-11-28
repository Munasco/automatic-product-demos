import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get canvas document for a chat
export const get = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("canvasDocuments")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .first();
  },
});

// Create or update canvas document
export const upsert = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
    content: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("canvasDocuments")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        content: args.content,
        language: args.language,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return ctx.db.insert("canvasDocuments", {
        chatId: args.chatId,
        title: args.title,
        content: args.content,
        language: args.language,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update content only
export const updateContent = mutation({
  args: {
    documentId: v.id("canvasDocuments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// Delete canvas document
export const remove = mutation({
  args: { documentId: v.id("canvasDocuments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
  },
});
