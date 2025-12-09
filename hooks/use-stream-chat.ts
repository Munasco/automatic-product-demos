"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("chat-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("chat-session-id", sessionId);
  }
  return sessionId;
};

interface UseStreamChatOptions {
  chatId: Id<"chats"> | null;
  model?: string;
}

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useStreamChat({ chatId, model = "gpt-5.1-mini" }: UseStreamChatOptions) {
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const sessionId = getSessionId();

  // Track stream we created
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);

  // Messages from DB
  const convexMessages = useQuery(
    api.messages.getAll,
    chatId ? { chatId } : "skip"
  );

  // Check if our active stream's message has content (meaning it's done)
  const activeStreamMessage = convexMessages?.find(m => m.streamId === activeStreamId);
  // Stream is done only when message exists AND has non-empty content
  const streamDone = !!activeStreamMessage?.content;

  // If stream is done, we should clear it - do this inline, not in effect
  const effectiveStreamId = streamDone ? null : activeStreamId;

  // Stream hook
  const streamUrl = convexSiteUrl ? new URL(`${convexSiteUrl}/chat-stream`) : new URL("http://localhost");
  const { text: streamText, status: streamStatus } = useStream(
    api.chat.getStreamBody,
    streamUrl,
    !!effectiveStreamId,
    effectiveStreamId as StreamId
  );

  // Mutations
  const addMessage = useMutation(api.messages.add);
  const createStreamMutation = useMutation(api.chat.createStream);
  const createChatMutation = useMutation(api.chats.create);
  const updateTitleMutation = useMutation(api.chats.updateTitle);
  const generateTitleAction = useAction(api.messages.generateTitle);

  // Can send when not actively streaming
  const isStreaming = !!effectiveStreamId && streamStatus === "streaming";
  const canSend = !isStreaming;

  // Build display messages
  const displayMessages: DisplayMessage[] = useMemo(() => {
    if (!convexMessages) return [];
    return convexMessages.map((msg) => {
      // Use streamText if this message is being streamed and has no content yet
      const useStreamContent =
        msg.streamId === effectiveStreamId &&
        msg.content === "" &&
        streamText;
      return {
        id: msg._id,
        role: msg.role as "user" | "assistant",
        content: useStreamContent ? streamText : msg.content,
      };
    });
  }, [convexMessages, effectiveStreamId, streamText]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !canSend) return;

    await addMessage({ chatId, role: "user", content });
    const { streamId } = await createStreamMutation({ chatId, model, sessionId });
    setActiveStreamId(streamId);
  }, [chatId, canSend, addMessage, createStreamMutation, model, sessionId]);

  // Create chat and send
  const createChatAndSend = useCallback(async (content: string): Promise<Id<"chats">> => {
    if (!canSend) throw new Error("Stream in progress");

    const tempTitle = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    const newChatId = await createChatMutation({ title: tempTitle });

    await addMessage({ chatId: newChatId, role: "user", content });
    const { streamId } = await createStreamMutation({ chatId: newChatId, model, sessionId });
    setActiveStreamId(streamId);

    generateTitleAction({ message: content, model })
      .then(async (generatedTitle) => {
        if (generatedTitle && generatedTitle !== tempTitle) {
          await updateTitleMutation({ chatId: newChatId, title: generatedTitle }).catch(() => {});
        }
      })
      .catch(() => {});

    return newChatId;
  }, [canSend, createChatMutation, addMessage, createStreamMutation, updateTitleMutation, generateTitleAction, model, sessionId]);

  const stop = useCallback(() => setActiveStreamId(null), []);

  return {
    messages: displayMessages,
    sendMessage,
    createChatAndSend,
    stop,
    isLoading: isStreaming,
    isLoadingMessages: chatId !== null && convexMessages === undefined,
  };
}
