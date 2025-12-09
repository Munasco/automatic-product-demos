"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage } from "./message";
import { ChatInput, type AttachedFile } from "./chat-input";
import { ThinkingIndicator } from "./thinking-indicator";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ModelType } from "@/stores/atoms";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  isLoadingMessages?: boolean;
  onToggleCanvas?: () => void;
  onToggleComments?: () => void;
  canvasOpen?: boolean;
  commentsOpen?: boolean;
  selectedModel?: ModelType;
  onModelChange?: (modelId: ModelType) => void;
  files?: AttachedFile[];
  onFilesChange?: (files: AttachedFile[]) => void;
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
  isLoadingMessages = false,
  onToggleCanvas,
  onToggleComments,
  canvasOpen,
  commentsOpen,
  selectedModel,
  onModelChange,
  files,
  onFilesChange,
}: ChatContainerProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  }, []);

  const isEmpty = messages.length === 0 && !isLoadingMessages;

  return (
    <div className="flex flex-col h-full w-full flex-1">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoadingMessages ? (
          <LoadingState />
        ) : isEmpty ? (
          <NoMessagesSent />
        ) : (
          <ScrollArea className="h-full" onScroll={handleScroll}>
            <div className="max-w-5xl mx-auto px-4 py-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={
                    isLoading &&
                    index === messages.length - 1 &&
                    message.role === "assistant"
                  }
                  onFork={() => onFork?.(index)}
                  onRegenerate={() => onRegenerate?.(index)}
                />
              ))}
              {/* Show thinking indicator when loading and no assistant message yet */}
              {isLoading &&
                (messages.length === 0 ||
                  messages[messages.length - 1]?.role === "user") && (
                  <ThinkingIndicator title="Thinking" isThinking={true} />
                )}
              <div ref={scrollBottomRef} />
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
