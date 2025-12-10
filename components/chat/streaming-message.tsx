"use client";

import { useEffect, useMemo } from "react";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "@/convex/_generated/api";
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingIndicator } from "./thinking-indicator";
import { ThinkingAccordion } from "./thinking-accordion";
import {
  parseThinkingSessions,
  type ThinkingSession,
} from "./thinking-sidebar";
import { toast } from "sonner";

interface StreamingMessageProps {
  streamId: string;
  streamUrl: URL;
  onOpenThinkingSidebar?: (
    sessions: ThinkingSession[],
    totalTime: number
  ) => void;
}

export function StreamingMessage({
  streamId,
  streamUrl,
  onOpenThinkingSidebar,
}: StreamingMessageProps) {
  const { text, status } = useStream(
    api.chat.getStreamBody,
    streamUrl,
    true, // driven - this instance drives the stream
    streamId as StreamId
  );

  // Parse thinking sessions from content
  const { sessions, totalTime, cleanContent } = useMemo(() => {
    if (!text) return { sessions: [], totalTime: 0, cleanContent: "" };
    return parseThinkingSessions(text);
  }, [text]);

  // Show toast on error
  useEffect(() => {
    if (status === "error") {
      toast.error("Failed to load response", {
        description: "Please try sending your message again.",
      });
    }
  }, [status]);

  // Show thinking indicator when pending/streaming with no content yet
  if ((status === "pending" || status === "streaming") && !text) {
    return <ThinkingIndicator title="Thinking" isThinking={true} />;
  }

  // Handle error
  if (status === "error") {
    return null;
  }

  const isStreaming = status === "pending" || status === "streaming";

  const handleOpenSidebar = () => {
    onOpenThinkingSidebar?.(sessions, totalTime);
  };

  return (
    <div>
      {/* Thinking accordion - shows summed time and most recent trace */}
      {sessions.length > 0 && (
        <ThinkingAccordion
          sessions={sessions}
          totalTime={totalTime}
          isStreaming={isStreaming}
          onOpenSidebar={handleOpenSidebar}
        />
      )}

      {/* Main content (with thinking markers removed) */}
      <MarkdownRenderer content={cleanContent} isStreaming={isStreaming} />
    </div>
  );
}
