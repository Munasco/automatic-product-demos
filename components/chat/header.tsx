"use client";

import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  PanelLeft,
  ChevronDown,
  PenSquare,
  Share,
  MessageSquare,
  Columns,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onToggleComments?: () => void;
  onToggleCanvas?: () => void;
  modelName?: string;
  commentCount?: number;
  commentsOpen?: boolean;
  canvasOpen?: boolean;
}

export function Header({
  onToggleSidebar,
  onNewChat,
  onToggleComments,
  onToggleCanvas,
  modelName = "Tennant Chat",
  commentCount = 0,
  commentsOpen = false,
  canvasOpen = false,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-3 border-b border-border">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-foreground-muted hover:text-foreground"
              onClick={onToggleSidebar}
            >
              <PanelLeft className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-foreground-muted hover:text-foreground"
              onClick={onNewChat}
            >
              <PenSquare className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New chat</TooltipContent>
        </Tooltip>
      </div>

      {/* Center - Model Selector */}
      <Button
        variant="ghost"
        className="gap-1.5 text-foreground font-medium hover:bg-background-hover"
      >
        {modelName}
        <ChevronDown className="size-4 text-foreground-muted" />
      </Button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Canvas toggle */}
        {onToggleCanvas && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-9",
                  canvasOpen
                    ? "text-accent"
                    : "text-foreground-muted hover:text-foreground"
                )}
                onClick={onToggleCanvas}
              >
                <Columns className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle canvas</TooltipContent>
          </Tooltip>
        )}

        {/* Comments toggle */}
        {onToggleComments && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-9 relative",
                  commentsOpen
                    ? "text-accent"
                    : "text-foreground-muted hover:text-foreground"
                )}
                onClick={onToggleComments}
              >
                <MessageSquare className="size-5" />
                {commentCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 flex items-center justify-center text-[10px] bg-accent text-background rounded-full">
                    {commentCount > 9 ? "9+" : commentCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle comments</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-foreground-muted hover:text-foreground"
            >
              <Share className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share</TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="icon" className="size-9">
          <div className="size-7 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-background">
            M
          </div>
        </Button>
      </div>
    </header>
  );
}
