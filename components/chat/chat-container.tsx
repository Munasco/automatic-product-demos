"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { ChatMessage } from "./message";
import { ChatInput, type AttachedFile } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ModelOption, type ReasoningEffort } from "@/stores/atoms";
import { Header } from "./header";
import { useSidebar } from "@/components/ui/sidebar";
import type { ThinkingSession } from "./thinking-sidebar";
import { ArrowDown } from "lucide-react";
import {
  ScrollCheckpoints,
  createMessageCheckpoints,
} from "@/components/ui/scroll-checkpoints";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streamId?: string;
  editVersion?: number;
}

interface ChatContainerProps {
  messages: Message[];
  streamUrl: URL | null;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onFork?: (messageIndex: number) => void;
  onRegenerate?: (messageIndex: number) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onComment?: (messageId: string, selectedText: string) => void;
  onAskAI?: (selectedText: string) => void;
  commentCount?: number;
  isStreaming?: boolean;
  isLoadingHistory?: boolean;
  onToggleCanvas?: () => void;
  onToggleComments?: () => void;
  canvasOpen?: boolean;
  commentsOpen?: boolean;
  selectedModel: ModelOption;
  onModelChange: (modelId: ModelOption) => void;
  reasoningEffort?: ReasoningEffort;
  onReasoningEffortChange?: (effort: ReasoningEffort) => void;
  files?: AttachedFile[];
  onFilesChange?: (files: AttachedFile[]) => void;
  webSearch?: boolean;
  onWebSearchChange?: (enabled: boolean) => void;
  onOpenThinkingSidebar?: (
    sessions: ThinkingSession[],
    totalTime: number
  ) => void;
}

export function ChatContainer({
  messages,
  streamUrl,
  input,
  onInputChange,
  onSubmit,
  onStop,
  onFork,
  onRegenerate,
  onEditMessage,
  onComment,
  onAskAI,
  commentCount,
  isStreaming = false,
  isLoadingHistory = false,
  onToggleCanvas,
  onToggleComments,
  canvasOpen,
  commentsOpen,
  selectedModel,
  onModelChange,
  reasoningEffort,
  onReasoningEffortChange,
  files,
  onFilesChange,
  webSearch,
  onWebSearchChange,
  onOpenThinkingSidebar,
}: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isEmpty = messages.length === 0 && !isLoadingHistory;
  const { setOpen: setSidebarOpen, open: sidebarOpen } = useSidebar();

  // Create message checkpoints for scroll navigation
  const messageCheckpoints = useMemo(
    () => createMessageCheckpoints(messages),
    [messages]
  );

  // Check scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) return;

    const checkScroll = () => {
      const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener('scroll', checkScroll);
      checkScroll(); // Initial check
      return () => viewport.removeEventListener('scroll', checkScroll);
    }
  }, [messages]);

  const scrollToBottom = () => {
    const scrollContainer = scrollAreaRef.current;
    if (!scrollContainer) return;

    const viewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full flex-1">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        modelName={selectedModel.id}
      />
      {/* Messages area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoadingHistory ? (
          <LoadingState />
        ) : isEmpty ? (
          <NoMessagesSent />
        ) : (
          <>
            {/* Message scroll checkpoints */}
            <ScrollCheckpoints
              messages={messageCheckpoints}
              containerRef={scrollAreaRef}
            />
            <ScrollArea ref={scrollAreaRef} className="h-full">
              <div className="max-w-5xl mx-auto px-4 py-6">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    streamUrl={streamUrl}
                    onFork={() => onFork?.(index)}
                    onRegenerate={() => onRegenerate?.(index)}
                    onEdit={
                      onEditMessage
                        ? (content) => onEditMessage(message.id, content)
                        : undefined
                    }
                    onComment={
                      onComment
                        ? (selectedText) => onComment(message.id, selectedText)
                        : undefined
                    }
                    onAskAI={onAskAI}
                    onOpenThinkingSidebar={onOpenThinkingSidebar}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Scroll to bottom button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 shadow-lg transition-all z-10"
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="w-5 h-5 text-zinc-300" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        value={input}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onStop={onStop}
        isLoading={isStreaming}
        onToggleCanvas={onToggleCanvas}
        onToggleComments={onToggleComments}
        canvasOpen={canvasOpen}
        commentsOpen={commentsOpen}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        reasoningEffort={reasoningEffort}
        onReasoningEffortChange={onReasoningEffortChange}
        files={files}
        onFilesChange={onFilesChange}
        webSearch={webSearch}
        onWebSearchChange={onWebSearchChange}
        commentCount={commentCount}
      />
    </div>
  );
}

function NoMessagesSent() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-3xl font-medium text-foreground">
        What&apos;s on your mind today?
      </h1>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-foreground-muted rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-foreground-muted rounded-full animate-pulse [animation-delay:150ms]" />
        <div className="w-2 h-2 bg-foreground-muted rounded-full animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}
