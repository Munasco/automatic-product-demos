"use client";

import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useChats() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.chats.list,
    {},
    { initialNumItems: 20 }
  );
  const createChat = useMutation(api.chats.create);
  const updateTitle = useMutation(api.chats.updateTitle);
  const removeChat = useMutation(api.chats.remove);
  const forkChat = useMutation(api.chats.fork);

  return {
    chats: results || [],
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    canLoadMore: status === "CanLoadMore",
    isComplete: status === "Exhausted",
    loadMore: () => loadMore(20),
    status,
    createChat: async (title?: string) => {
      return createChat({ title });
    },
    updateTitle: async (chatId: Id<"chats">, title: string) => {
      return updateTitle({ chatId, title });
    },
    removeChat: async (chatId: Id<"chats">) => {
      return removeChat({ chatId });
    },
    forkChat: async (chatId: Id<"chats">, messageIndex: number) => {
      return forkChat({ chatId, messageIndex });
    },
  };
}

export function useChat(chatId: Id<"chats"> | null) {
  const chat = useQuery(
    api.chats.get,
    chatId ? { chatId } : "skip"
  );
  const addMessageMutation = useMutation(api.messages.add);

  return {
    chat,
    isLoading: chatId !== null && chat === undefined,
    addMessage: async (
      role: "user" | "assistant",
      content: string,
      overrideChatId?: Id<"chats">,
      attachments?: { name: string; type: string; url: string }[]
    ) => {
      const targetChatId = overrideChatId ?? chatId;
      if (!targetChatId) throw new Error("No chat selected");
      return addMessageMutation({ chatId: targetChatId, role, content, attachments });
    },
  };
}
