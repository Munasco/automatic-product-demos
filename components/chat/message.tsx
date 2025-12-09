"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  GitFork,
  Check,
  MessageSquare,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === "user";

  return (
    <div className={cn("group py-4", isUser ? "flex justify-end" : "")}>
      <div className={cn(isUser ? "max-w-[70%] ml-auto" : "")}>
        {/* Message Content */}
        <div
          className={cn(
            isUser
              ? "rounded-[18px] px-4 py-1.5 bg-background-user-message border border-white/5 text-foreground whitespace-pre-wrap"
              : "px-4 py-1 text-foreground"
          )}
        >
          <div
            className={cn(
              "prose prose-invert max-w-none",
              isUser && "text-[15px]"
            )}
          >
            <MarkdownRenderer content={message.content} />
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && !isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
