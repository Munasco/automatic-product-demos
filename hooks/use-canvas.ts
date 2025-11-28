"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useCanvas(chatId: Id<"chats"> | null) {
  const document = useQuery(
    api.canvas.get,
    chatId ? { chatId } : "skip"
  );

  const upsertDocument = useMutation(api.canvas.upsert);
  const updateContent = useMutation(api.canvas.updateContent);
  const removeDocument = useMutation(api.canvas.remove);

  return {
    document,
    isLoading: chatId !== null && document === undefined,

    createOrUpdate: async (
      title: string,
      content: string,
      language: string = "text"
    ) => {
      if (!chatId) throw new Error("No chat selected");
      return upsertDocument({ chatId, title, content, language });
    },

    updateContent: async (content: string) => {
      if (!document) throw new Error("No document");
      return updateContent({ documentId: document._id, content });
    },

    remove: async () => {
      if (!document) throw new Error("No document");
      return removeDocument({ documentId: document._id });
    },
  };
}
