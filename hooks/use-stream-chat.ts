"use client";

import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { useAtom } from "jotai";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { isStreamingAtom } from "@/stores/atoms";

interface UseStreamChatOptions {
  chatId: Id<"chats"> | null;
  model?: string;
  reasoningEffort?: "auto" | "deepthink";
  webSearch?: boolean;
}

export function useStreamChat({ chatId, model = "gpt-5.1", reasoningEffort, webSearch }: UseStreamChatOptions) {
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const [isStreaming, setIsStreaming] = useAtom(isStreamingAtom);

  const convexMessages = useQuery(api.messages.getAll, chatId ? { chatId } : "skip");

  // Sync streaming state from server (check if any message is streaming)
  const serverIsStreaming = convexMessages?.some(
    (msg) => msg.role === "assistant" && msg.streamId && !msg.content
  ) ?? false;

  // Update local atom when server state changes
  useEffect(() => {
    setIsStreaming(serverIsStreaming);
  }, [serverIsStreaming, setIsStreaming]);

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

  const sendMessage = useCallback(async (content: string, editVersion?: number) => {
    if (!chatId || isStreaming) return;
    setIsStreaming(true); // Optimistic update
    await addMessage({ chatId, role: "user", content, editVersion });
    await createStreamMutation({ chatId, model, reasoningEffort, webSearch });
  }, [chatId, isStreaming, setIsStreaming, addMessage, createStreamMutation, model, reasoningEffort, webSearch]);

  const createChatAndSend = useCallback(async (content: string): Promise<Id<"chats">> => {
    if (isStreaming) throw new Error("Stream in progress");

    setIsStreaming(true); // Optimistic update

    const tempTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    const newChatId = await createChatMutation({ title: tempTitle });

    await addMessage({ chatId: newChatId, role: "user", content });

    generateTitleAction({ message: content, model })
      .then((title) => {
        if (title) updateTitleMutation({ chatId: newChatId, title }).catch(() => { });
      })
      .catch(() => { });

    await createStreamMutation({ chatId: newChatId, model, reasoningEffort, webSearch });

    return newChatId;
  }, [isStreaming, setIsStreaming, createChatMutation, addMessage, createStreamMutation, updateTitleMutation, generateTitleAction, model, reasoningEffort, webSearch]);

  // Return raw messages - streaming handled by StreamingMessage component
  const messages = (convexMessages ?? []).map((msg) => ({
    id: msg._id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    streamId: msg.streamId,
    editVersion: msg.editVersion,
  }));

  const stop = useCallback(async () => {
    if (!chatId) return;
    setIsStreaming(false); // Immediate local update
    await cancelStreamMutation({ chatId });
  }, [chatId, setIsStreaming, cancelStreamMutation]);

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
