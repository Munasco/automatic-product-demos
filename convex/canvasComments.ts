import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

// Get all comments for a canvas document
export const listByCanvas = query({
  args: { canvasDocumentId: v.id("canvasDocuments") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("canvasComments")
      .withIndex("by_canvas", (q) => q.eq("canvasDocumentId", args.canvasDocumentId))
      .order("asc")
      .collect();

    // Get replies for each comment
    return Promise.all(
      comments.map(async (comment) => {
        const replies = await ctx.db
          .query("canvasCommentReplies")
          .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
          .order("asc")
          .collect();
        return { ...comment, replies };
      })
    );
  },
});

// Create a new inline comment on a selection
export const createInline = mutation({
  args: {
    canvasDocumentId: v.id("canvasDocuments"),
    selectionStart: v.number(),
    selectionEnd: v.number(),
    selectedText: v.string(),
    content: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("canvasComments", {
      canvasDocumentId: args.canvasDocumentId,
      type: "inline",
      selectionStart: args.selectionStart,
      selectionEnd: args.selectionEnd,
      selectedText: args.selectedText,
      content: args.content,
      author: args.author,
      createdAt: now,
      updatedAt: now,
      resolved: false,
      status: "pending",
    });
  },
});

// Create a general comment (not tied to selection)
export const createGeneral = mutation({
  args: {
    canvasDocumentId: v.id("canvasDocuments"),
    content: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("canvasComments", {
      canvasDocumentId: args.canvasDocumentId,
      type: "general",
      content: args.content,
      author: args.author,
      createdAt: now,
      updatedAt: now,
      resolved: false,
      status: "pending",
    });
  },
});

// Add a reply to a canvas comment
export const addReply = mutation({
  args: {
    commentId: v.id("canvasComments"),
    content: v.string(),
    author: v.string(),
    isAI: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Update parent comment's updatedAt
    await ctx.db.patch(args.commentId, {
      updatedAt: Date.now(),
    });

    return ctx.db.insert("canvasCommentReplies", {
      commentId: args.commentId,
      content: args.content,
      author: args.author,
      isAI: args.isAI ?? false,
      createdAt: Date.now(),
    });
  },
});

// Add AI reply to a canvas comment (verbose, detailed response)
export const addAIReply = action({
  args: {
    commentId: v.id("canvasComments"),
    commentContent: v.string(),
    selectedText: v.optional(v.string()),
    canvasContent: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Comment: "${args.commentContent}"${args.selectedText ? `\n\nSelected text being discussed:\n"${args.selectedText}"` : ""}${args.canvasContent ? `\n\nFull document context:\n${args.canvasContent.slice(0, 2000)}` : ""}\n\nProvide a detailed, helpful response to this comment.`;

    const { text } = await generateText({
      model: openai("gpt-5.1"),
      system: `You are a helpful assistant responding to comments in a code/document editor. Provide detailed, thorough, and verbose explanations. Be comprehensive and helpful.

Key guidelines:
- Give detailed explanations with examples when relevant
- If explaining code, include code snippets
- Break down complex topics into clear sections
- Be educational and thorough`,
      prompt,
      providerOptions: {
        openai: {
          textVerbosity: "high",
        },
      },
    });

    const aiResponse = text || "I understand. Let me help with that.";

    // Save the AI reply
    await ctx.runMutation(api.canvasComments.addReply, {
      commentId: args.commentId,
      content: aiResponse,
      author: "AI",
      isAI: true,
    });

    return aiResponse;
  },
});

// Resolve/unresolve a canvas comment
export const toggleResolved = mutation({
  args: { commentId: v.id("canvasComments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    await ctx.db.patch(args.commentId, {
      resolved: !comment.resolved,
      updatedAt: Date.now(),
    });
  },
});

// Delete a canvas comment and its replies
export const remove = mutation({
  args: { commentId: v.id("canvasComments") },
  handler: async (ctx, args) => {
    // Delete all replies first
    const replies = await ctx.db
      .query("canvasCommentReplies")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);
  },
});

// Submit all pending comments for review (GitHub-style)
export const submitForReview = mutation({
  args: { canvasDocumentId: v.id("canvasDocuments") },
  handler: async (ctx, args) => {
    const pendingComments = await ctx.db
      .query("canvasComments")
      .withIndex("by_canvas", (q) => q.eq("canvasDocumentId", args.canvasDocumentId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Change all pending comments to reviewing status
    for (const comment of pendingComments) {
      await ctx.db.patch(comment._id, {
        status: "reviewing",
        updatedAt: Date.now(),
      });
    }

    return pendingComments.length;
  },
});
