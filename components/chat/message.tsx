"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  GitFork,
  Check,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Brain,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import type { Message } from "../../types/chat";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onFork?: () => void;
  onRegenerate?: () => void;
  showActions?: boolean;
  commentCount?: number;
}

export function ChatMessage({
  message,
  isStreaming = false,
  onFork,
  onRegenerate,
  showActions = true,
  commentCount = 0,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";
  const hasReasoning = message.reasoning && message.reasoning.length > 0;

  return (
    <div className={cn("group py-4", isUser ? "flex justify-end" : "")}>
      <div
        className={cn(
          isUser ? "max-w-[70%] ml-auto" : "max-w-[85%] md:max-w-[75%] mr-auto"
        )}
      >
        {/* Reasoning/Thinking Section */}
        {hasReasoning && !isUser && (
          <div className="mb-2">
            <button
              onClick={() => setReasoningOpen(!reasoningOpen)}
              className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {reasoningOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              <Brain className="size-4" />
              <span>{isStreaming ? "Thinking..." : "View reasoning"}</span>
            </button>
            {reasoningOpen && (
              <div className="mt-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-foreground-muted">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  {message.reasoning}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            isUser
              ? "rounded-[18px] px-4 py-1.5 bg-background-user-message border border-white/5 text-foreground whitespace-pre-wrap"
              : "px-4 py-1 text-foreground"
          )}
        >
          <div className={cn("prose prose-invert max-w-none", isUser && "text-[15px]")}>
            <MarkdownRenderer content={message.content} />
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && !isStreaming && (
          <div className="flex items-center gap-1 mt-2 opacity-0 hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-foreground-muted hover:text-foreground"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>

            {!isUser && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-foreground-muted hover:text-foreground"
                    >
                      <Volume2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Read aloud</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-foreground-muted hover:text-foreground"
                    >
                      <ThumbsUp className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Good response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-foreground-muted hover:text-foreground"
                    >
                      <ThumbsDown className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bad response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-foreground-muted hover:text-foreground"
                      onClick={onRegenerate}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-foreground-muted hover:text-foreground"
                      onClick={onFork}
                    >
                      <GitFork className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fork from here</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Comment count indicator */}
            {commentCount > 0 && (
              <div className="flex items-center gap-1 ml-2 text-xs text-foreground-muted">
                <MessageSquare className="size-3" />
                {commentCount}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

