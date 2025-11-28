"use client";

import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "../convex/_generated/api";
import type { StreamId } from "@convex-dev/persistent-text-streaming";

// Get the Convex site URL from environment
const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site") || "";

export function useStreamChat(streamId: StreamId | undefined, driven: boolean) {
  const { text, status } = useStream(
    api.messages.getStreamBody,
    new URL(`${CONVEX_SITE_URL}/stream-chat`),
    driven,
    streamId
  );

  return {
    text,
    status,
    isStreaming: status === "streaming",
    isDone: status === "done",
  };
}
