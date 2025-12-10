"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

interface UseStreamChatOptions {
  chatId: Id<"chats"> | null;
  model?: string;
  reasoningEffort?: "auto" | "deepthink";
}

export function useStreamChat({ chatId, model = "gpt-5.1", reasoningEffort }: UseStreamChatOptions) {
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

  const convexMessages = useQuery(api.messages.getAll, chatId ? { chatId } : "skip");

  // Stream URL for components to use
  const streamUrl = convexSiteUrl
    ? new URL(`${convexSiteUrl}/chat-stream`)
    : null;

  const addMessage = useMutation(api.messages.add);
  const createStreamMutation = useMutation(api.chat.createStream);
  const cancelStreamMutation = useMutation(api.chat.cancelStream);
  const createChatMutation = useMutation(api.chats.create);
  const updateTitleMutation = useMutation(api.chats.updateTitle);
  const generateTitleAction = useAction(api.messages.generateTitle);

  // Check if any message is currently streaming (has streamId but no content)
  const isStreaming = convexMessages?.some(
    (msg) => msg.role === "assistant" && msg.streamId && !msg.content
  ) ?? false;

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || isStreaming) return;
    await addMessage({ chatId, role: "user", content });
    await createStreamMutation({ chatId, model, reasoningEffort });
  }, [chatId, isStreaming, addMessage, createStreamMutation, model, reasoningEffort]);

  const createChatAndSend = useCallback(async (content: string): Promise<Id<"chats">> => {
    if (isStreaming) throw new Error("Stream in progress");

    const tempTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    const newChatId = await createChatMutation({ title: tempTitle });

    await addMessage({ chatId: newChatId, role: "user", content });

    generateTitleAction({ message: content, model })
      .then((title) => {
        if (title) updateTitleMutation({ chatId: newChatId, title }).catch(() => { });
      })
      .catch(() => { });

    await createStreamMutation({ chatId: newChatId, model, reasoningEffort });

    return newChatId;
  }, [isStreaming, createChatMutation, addMessage, createStreamMutation, updateTitleMutation, generateTitleAction, model, reasoningEffort]);

  // Return raw messages - streaming handled by StreamingMessage component
  const messages = (convexMessages ?? []).map((msg) => ({
    id: msg._id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    streamId: msg.streamId,
  }));

  const stop = useCallback(async () => {
    if (!chatId || !isStreaming) return;
    await cancelStreamMutation({ chatId });
  }, [chatId, isStreaming, cancelStreamMutation]);

  return {
    messages,
    streamUrl,
    sendMessage,
    createChatAndSend,
    stop,
    isStreaming,
    isLoadingHistory: chatId !== null && convexMessages === undefined,
  };
}
