import type { Id } from "../convex/_generated/dataModel";

export interface Message {
  id: Id<"messages">;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  attachments?: { name: string; type: string; url: string }[];
  reasoning?: string;
}

export interface Chat {
  id: Id<"chats">;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
  parentId?: Id<"chats">;
  forkMessageIndex?: number;
  forkCount?: number;
}
