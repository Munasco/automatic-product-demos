"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage } from "./message";
import { ChatInput, type AttachedFile } from "./chat-input";
import { ThinkingIndicator } from "./thinking-indicator";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";
import type { Message } from "../../types/chat";
import type { Id } from "../../convex/_generated/dataModel";

interface Comment {
  _id: Id<"comments">;
  messageId: Id<"messages">;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  resolved: boolean;
}

interface ChatContainerProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  onFork?: (messageIndex: number) => void;
  onRegenerate?: (messageIndex: number) => void;
  isLoading?: boolean;
  isLoadingHistory?: boolean;
  comments?: Comment[];
  onToggleCanvas?: () => void;
  onToggleComments?: () => void;
  canvasOpen?: boolean;
  commentsOpen?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  files?: AttachedFile[];
  onFilesChange?: (files: AttachedFile[]) => void;
  onLoadMore?: (numItems: number) => void;
  hasMore?: boolean;
}

export function ChatContainer({
  messages,
  input,
  onInputChange,
  onSubmit,
  onStop,
  onFork,
  onRegenerate,
  isLoading = false,
  isLoadingHistory = false,
  comments = [],
  onToggleCanvas,
  onToggleComments,
  canvasOpen,
  commentsOpen,
  selectedModel,
  onModelChange,
  files,
  onFilesChange,
  onLoadMore,
  hasMore = false,
}: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom function (manual button only)
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle scroll to show/hide scroll button and load more
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isAtBottom);

    // Load more when scrolling to top
    if (target.scrollTop === 0 && hasMore && onLoadMore) {
      onLoadMore(20);
    }
  }, [hasMore, onLoadMore]);

  // Scroll to bottom ONCE when user submits (loading starts)
  const prevIsLoading = useRef(isLoading);
  useEffect(() => {
    if (isLoading && !prevIsLoading.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

  const isEmpty = messages.length === 0 && !isLoadingHistory;

  return (
    <div className="flex flex-col h-full w-full flex-1">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden relative">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-full" onScrollCapture={handleScroll}>
            <div ref={scrollAreaRef} className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((message, index) => {
                const messageComments = comments.filter(
                  (c) => c.messageId === message.id
                );

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
                    onFork={() => onFork?.(index)}
                    onRegenerate={() => onRegenerate?.(index)}
                    commentCount={messageComments.length}
                  />
                );
              })}
              {/* Show thinking indicator when loading and no assistant message yet */}
              {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
                <ThinkingIndicator title="Thinking" isThinking={true} />
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && !isEmpty && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 size-8 rounded-full bg-background-secondary border border-border shadow-md hover:bg-background-hover"
            onClick={scrollToBottom}
          >
            <ArrowDown className="size-4" />
          </Button>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        value={input}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onStop={onStop}
        isLoading={isLoading}
        onToggleCanvas={onToggleCanvas}
        onToggleComments={onToggleComments}
        canvasOpen={canvasOpen}
        commentsOpen={commentsOpen}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        files={files}
        onFilesChange={onFilesChange}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-3xl font-medium text-foreground">
        What&apos;s on your mind today?
      </h1>
    </div>
  );
}
