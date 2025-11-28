import { usePaginatedQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useMessages(chatId: Id<"chats"> | null) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.list,
    chatId ? { chatId } : "skip",
    { initialNumItems: 20 }
  );

  return {
    messages: results || [],
    isLoading: status === "LoadingFirstPage",
    loadMore,
    status,
  };
}
