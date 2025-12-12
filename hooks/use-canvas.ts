"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useConvexErrorHandler } from "./use-convex-error-handler";

export function useCanvas(chatId: Id<"chats"> | null) {
  const document = useQuery(
    api.canvas.get,
    chatId ? { chatId } : "skip"
  );

  const upsertDocument = useMutation(api.canvas.upsert);
  const updateContent = useMutation(api.canvas.updateContent);
  const removeDocument = useMutation(api.canvas.remove);
  const { executeWithErrorHandling } = useConvexErrorHandler();

  return {
    document,
    isLoading: chatId !== null && document === undefined,

    createOrUpdate: async (
      title: string,
      content: string,
      language: string = "text"
    ) => {
      if (!chatId) {
        throw new Error("No chat selected");
      }
      return executeWithErrorHandling(
        () => upsertDocument({ chatId, title, content, language }),
        "create-or-update-canvas"
      );
    },

    updateContent: async (content: string) => {
      if (!document) {
        throw new Error("No document found");
      }
      return executeWithErrorHandling(
        () => updateContent({ documentId: document._id, content }),
        "update-canvas-content"
      );
    },

    remove: async () => {
      if (!document) {
        throw new Error("No document found");
      }
      return executeWithErrorHandling(
        () => removeDocument({ documentId: document._id }),
        "remove-canvas"
      );
    },
  };
}
