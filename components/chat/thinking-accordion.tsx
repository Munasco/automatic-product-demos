"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThinkingSession } from "./thinking-sidebar";

interface ThinkingAccordionProps {
  sessions: ThinkingSession[];
  totalTime: number;
  isStreaming: boolean;
  onOpenSidebar: () => void;
}

export function ThinkingAccordion({
  sessions,
  totalTime,
  isStreaming,
  onOpenSidebar,
}: ThinkingAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sessions.length === 0) return null;

  // Get the most recent session
  const latestSession = sessions[sessions.length - 1];
  const isThinking = isStreaming && !latestSession.isComplete;

  // Extract title from latest session
  const lines = latestSession.content.trim().split("\n");
  const title = extractTitle(lines[0]) || "Thinking...";

  const handleClick = () => {
    if (sessions.length > 1) {
      // Multiple sessions - open sidebar
      onOpenSidebar();
    } else {
      // Single session - toggle inline expansion
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="mb-4">
      {/* Accordion header */}
      <button
        onClick={handleClick}
        className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground-secondary transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <span className="font-medium">
          {isThinking ? "Thinking..." : `Thought for ${totalTime}s`}
        </span>
        {sessions.length > 1 && (
          <span className="text-xs bg-background-secondary px-1.5 py-0.5 rounded">
            {sessions.length} steps
          </span>
        )}
      </button>

      {/* Expanded content - only show for single session */}
      {isExpanded && sessions.length === 1 && (
        <div className="mt-2 pl-6 text-sm text-foreground-muted leading-relaxed">
          {/* Title/summary */}
          {title && title !== "Thinking..." && (
            <p className="font-medium text-foreground-secondary mb-1">{title}</p>
          )}
          {/* Content */}
          <div className="whitespace-pre-wrap">
            {lines.slice(1).join("\n").trim() || latestSession.content}
          </div>
        </div>
      )}

      {/* For multiple sessions, show a preview */}
      {isExpanded && sessions.length > 1 && (
        <div className="mt-2 pl-6">
          <button
            onClick={onOpenSidebar}
            className="text-sm text-accent hover:text-accent-hover"
          >
            View all {sessions.length} thinking steps →
          </button>
        </div>
      )}
    </div>
  );
}

function extractTitle(line: string): string {
  if (!line) return "";
  let cleaned = line.replace(/\*\*/g, "").trim();
  if (cleaned.length > 60) {
    cleaned = cleaned.slice(0, 57) + "...";
  }
  return cleaned;
}
