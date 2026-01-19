"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  PanelLeft,
  ChevronDown,
  Share,
  MessageSquare,
  Columns,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CodeThemeSelector } from "../code-theme-selector";
import { SettingsDialog } from "../settings-dialog";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleComments?: () => void;
  onToggleCanvas?: () => void;
  modelName?: string;
  commentCount?: number;
  commentsOpen?: boolean;
  canvasOpen?: boolean;
}

export function Header({
  onToggleSidebar,
  onToggleComments,
  onToggleCanvas,
  modelName = "Chat",
  commentCount = 0,
  commentsOpen = false,
  canvasOpen = false,
}: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
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
      </div>

      {/* Center - App Name & Model */}
      <div className="flex items-center gap-2">
        <span className="text-foreground font-semibold">Tennant Chat</span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-foreground-muted hover:bg-background-hover"
        >
          {modelName}
          <ChevronDown className="size-3" />
        </Button>
      </div>

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

        {/* Code Theme Selector */}
        <CodeThemeSelector />

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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-foreground-muted hover:text-foreground"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Settings</TooltipContent>
        </Tooltip>
      </div>
    </header>

    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
