"use client";

import { useEffect, useMemo } from "react";
import { useStream } from "@/lib/streaming/useStream";
import { useAtomValue } from "jotai";
import { api } from "@/convex/_generated/api";
import type { StreamId } from "@/convex/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingIndicator } from "./thinking-indicator";
import { ThinkingAccordion } from "./thinking-accordion";
import {
  parseThinkingSessions,
  type ThinkingSession,
} from "./thinking-sidebar";
import { toast } from "sonner";
import { shouldStreamAtom } from "@/stores/atoms";
import {
  ToolPanel,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
  type ToolState,
} from "@/components/ai-elements/tool";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";

interface StreamingMessageProps {
  streamId?: string;
  streamUrl?: URL;
  initialContent?: string;
  isStreaming?: boolean;
  onOpenThinkingSidebar?: (
    sessions: ThinkingSession[],
    totalTime: number
  ) => void;
  onComment?: (selectedText: string) => void;
  onAskAI?: (selectedText: string) => void;
}

type ToolCallPayload = {
  toolName?: string;
  toolCallId?: string;
  input?: unknown;
};

type ToolResultPayload = {
  toolName?: string;
  toolCallId?: string;
  output?: unknown;
  error?: unknown;
};

type SourcePayload = {
  sourceType?: string;
  title?: string;
  url?: string;
};

function safeDecodeJson<T>(encoded: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(encoded)) as T;
  } catch {
    return null;
  }
}

function parseToolAndSourceMarkers(content: string): {
  tools: Array<{
    toolName: string;
    toolCallId: string;
    state: ToolState;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  }>;
  sources: Array<{ title: string; url: string }>;
  cleanContent: string;
} {
  const toolCalls: ToolCallPayload[] = [];
  const toolResults: ToolResultPayload[] = [];
  const sources: SourcePayload[] = [];

  let syntheticCallIndex = 0;
  let syntheticResultIndex = 0;

  const toolCallRegex = /<!--TOOL_CALL:([^>]+)-->/g;
  const toolResultRegex = /<!--TOOL_RESULT:([^>]+)-->/g;
  const sourceRegex = /<!--SOURCE:([^>]+)-->/g;

  let match: RegExpExecArray | null;
  while ((match = toolCallRegex.exec(content)) !== null) {
    const payload = safeDecodeJson<ToolCallPayload>(match[1]);
    if (payload) toolCalls.push(payload);
  }
  while ((match = toolResultRegex.exec(content)) !== null) {
    const payload = safeDecodeJson<ToolResultPayload>(match[1]);
    if (payload) toolResults.push(payload);
  }
  while ((match = sourceRegex.exec(content)) !== null) {
    const payload = safeDecodeJson<SourcePayload>(match[1]);
    if (payload) sources.push(payload);
  }

  const cleanContent = content
    .replace(toolCallRegex, "")
    .replace(toolResultRegex, "")
    .replace(sourceRegex, "")
    .trim();

  const map = new Map<
    string,
    {
      toolName: string;
      toolCallId: string;
      state: ToolState;
      input?: unknown;
      output?: unknown;
      errorText?: string;
    }
  >();

  for (const call of toolCalls) {
    const toolName = call.toolName ?? "tool";
    const toolCallId =
      call.toolCallId ?? `${toolName}-call-${syntheticCallIndex++}`;
    map.set(toolCallId, {
      toolName,
      toolCallId,
      state: "input-available",
      input: call.input,
    });
  }

  for (const result of toolResults) {
    const toolName = result.toolName ?? "tool";
    const toolCallId =
      result.toolCallId ?? `${toolName}-result-${syntheticResultIndex++}`;
    const prev = map.get(toolCallId);
    const errorText =
      result.error === undefined || result.error === null
        ? undefined
        : typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error);

    map.set(toolCallId, {
      toolName: prev?.toolName ?? toolName,
      toolCallId,
      state: errorText ? "output-error" : "output-available",
      input: prev?.input,
      output: result.output,
      errorText,
    });
  }

  const dedupSources = new Map<string, { title: string; url: string }>();
  for (const s of sources) {
    if (!s.url) continue;
    dedupSources.set(s.url, {
      title: s.title || new URL(s.url).hostname,
      url: s.url,
    });
  }

  return {
    tools: Array.from(map.values()),
    sources: Array.from(dedupSources.values()),
    cleanContent,
  };
}

// Wrapper that decides between streaming and static rendering
export function StreamingMessage({
  streamId,
  streamUrl,
  initialContent,
  onOpenThinkingSidebar,
  onComment,
  onAskAI,
}: StreamingMessageProps) {
  // Track if this message started as streaming (on initial mount)
  // This prevents switching to StaticMessage mid-stream when DB updates
  const wasStreaming = !!(streamId && streamUrl && !initialContent);

  // Keep using ActiveStreamMessage if we started streaming
  if (wasStreaming && streamId && streamUrl) {
    return (
      <ActiveStreamMessage
        streamId={streamId}
        streamUrl={streamUrl}
        onOpenThinkingSidebar={onOpenThinkingSidebar}
        onComment={onComment}
        onAskAI={onAskAI}
      />
    );
  }

  // Only StaticMessage for messages loaded from DB on page load
  if (initialContent) {
    return (
      <StaticMessage
        content={initialContent}
        onOpenThinkingSidebar={onOpenThinkingSidebar}
        onComment={onComment}
        onAskAI={onAskAI}
      />
    );
  }

  // Fallback - should not happen
  return null;
}

// Static message with thinking parsing (for completed messages)
function StaticMessage({
  content,
  onOpenThinkingSidebar,
  onComment,
  onAskAI,
}: {
  content: string;
  onOpenThinkingSidebar?: (
    sessions: ThinkingSession[],
    totalTime: number
  ) => void;
  onComment?: (selectedText: string) => void;
  onAskAI?: (selectedText: string) => void;
}) {
  const { sessions, totalTime, toolData, cleanContent } = useMemo(() => {
    const thinking = parseThinkingSessions(content);
    const toolData = parseToolAndSourceMarkers(thinking.cleanContent);
    return {
      sessions: thinking.sessions,
      totalTime: thinking.totalTime,
      toolData,
      cleanContent: toolData.cleanContent,
    };
  }, [content]);

  const handleOpenSidebar = () => {
    onOpenThinkingSidebar?.(sessions, totalTime);
  };

  return (
    <div>
      {sessions.length > 0 && (
        <ThinkingAccordion
          sessions={sessions}
          totalTime={totalTime}
          isStreaming={false}
          onOpenSidebar={handleOpenSidebar}
        />
      )}
      {toolData.tools.map((t) => (
        <ToolPanel
          key={t.toolCallId}
          defaultOpen={t.state === "input-available"}
        >
          <ToolHeader toolName={t.toolName} state={t.state} />
          <ToolContent>
            <ToolInput input={t.input} />
            <ToolOutput output={t.output} errorText={t.errorText} />
          </ToolContent>
        </ToolPanel>
      ))}
      {toolData.sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={toolData.sources.length} />
          <SourcesContent>
            {toolData.sources.map((s) => (
              <Source key={s.url} href={s.url} title={s.title} />
            ))}
          </SourcesContent>
        </Sources>
      )}
      <MarkdownRenderer
        content={cleanContent}
        isStreaming={false}
        onComment={onComment}
        onAskAI={onAskAI}
      />
    </div>
  );
}

// Active streaming message
function ActiveStreamMessage({
  streamId,
  streamUrl,
  onOpenThinkingSidebar,
  onComment,
  onAskAI,
}: {
  streamId: string;
  streamUrl: URL;
  onOpenThinkingSidebar?: (
    sessions: ThinkingSession[],
    totalTime: number
  ) => void;
  onComment?: (selectedText: string) => void;
  onAskAI?: (selectedText: string) => void;
}) {
  const globalIsStreaming = useAtomValue(shouldStreamAtom);

  const { text, status } = useStream(
    api.chatThread.getStreamBody,
    streamUrl,
    globalIsStreaming, // driven by atom state
    streamId as StreamId
  );

  const { sessions, totalTime, cleanContent } = useMemo(() => {
    if (!text) return { sessions: [], totalTime: 0, cleanContent: "" };
    return parseThinkingSessions(text);
  }, [text]);

  const toolData = useMemo(() => {
    return parseToolAndSourceMarkers(cleanContent);
  }, [cleanContent]);

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

  if (status === "error") {
    return null;
  }

  const isStreaming = status === "pending" || status === "streaming";

  const handleOpenSidebar = () => {
    onOpenThinkingSidebar?.(sessions, totalTime);
  };

  return (
    <div>
      {sessions.length > 0 && (
        <ThinkingAccordion
          sessions={sessions}
          totalTime={totalTime}
          isStreaming={isStreaming}
          onOpenSidebar={handleOpenSidebar}
        />
      )}
      {toolData.tools.map((t) => (
        <ToolPanel
          key={t.toolCallId}
          defaultOpen={t.state === "input-available"}
        >
          <ToolHeader toolName={t.toolName} state={t.state} />
          <ToolContent>
            <ToolInput input={t.input} />
            <ToolOutput output={t.output} errorText={t.errorText} />
          </ToolContent>
        </ToolPanel>
      ))}
      {toolData.sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={toolData.sources.length} />
          <SourcesContent>
            {toolData.sources.map((s) => (
              <Source key={s.url} href={s.url} title={s.title} />
            ))}
          </SourcesContent>
        </Sources>
      )}
      <MarkdownRenderer
        content={toolData.cleanContent}
        isStreaming={isStreaming}
        onComment={onComment}
        onAskAI={onAskAI}
      />
    </div>
  );
}
