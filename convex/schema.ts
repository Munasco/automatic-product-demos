import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    parentId: v.optional(v.id("chats")),
    forkMessageIndex: v.optional(v.number()),
    forkCount: v.optional(v.number()),
  }).index("by_updated", ["updatedAt"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
    streamId: v.optional(v.string()), // For persistent streaming
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      url: v.string(), // base64 data URL or storage URL
    }))),
  }).index("by_chat", ["chatId", "createdAt"]),

  // Comments on message selections (Google Docs style)
  comments: defineTable({
    messageId: v.id("messages"),
    selectionStart: v.number(),
    selectionEnd: v.number(),
    selectedText: v.string(),
    content: v.string(),
    author: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolved: v.boolean(),
  })
    .index("by_message", ["messageId", "createdAt"])
    .index("by_message_unresolved", ["messageId", "resolved"]),

  // Replies to comments (thread)
  commentReplies: defineTable({
    commentId: v.id("comments"),
    content: v.string(),
    author: v.string(),
    createdAt: v.number(),
  }).index("by_comment", ["commentId", "createdAt"]),

  // Canvas documents (code/text editor)
  canvasDocuments: defineTable({
    chatId: v.id("chats"),
    title: v.string(),
    content: v.string(),
    language: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_chat", ["chatId", "updatedAt"]),
});
