"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface ThinkingIndicatorProps {
  title?: string;
  content?: string;
  isThinking?: boolean;
}

export function ThinkingIndicator({
  title = "Thinking",
  content,
  isThinking = true,
}: ThinkingIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-4">
      <div className="max-w-[85%] md:max-w-[75%]">
        <button
          onClick={() => content && setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 text-sm transition-colors",
            content ? "text-foreground-secondary hover:text-foreground cursor-pointer" : "text-foreground-muted cursor-default"
          )}
        >
          {content ? (
            <ChevronRight
              className={cn(
                "size-4 transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          ) : (
            <Sparkles className={cn("size-4", isThinking && "animate-pulse")} />
          )}
          <span className="font-medium">{title}</span>
          {isThinking && (
            <span className="flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-pulse delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-pulse delay-150" />
            </span>
          )}
        </button>

        {expanded && content && (
          <div className="mt-3 pl-6 rounded-lg bg-background-secondary/50 p-3">
            <div className="text-sm text-foreground-muted leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        )}

        {!expanded && content && (
          <div className="mt-2 pl-6">
            <p className="text-sm text-foreground-muted line-clamp-2 leading-relaxed">
              {content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
