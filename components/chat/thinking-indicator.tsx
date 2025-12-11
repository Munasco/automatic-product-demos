"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

// Animated text with wave effect on each character
function AnimatedText({ text, animate = true }: { text: string; animate?: boolean }) {
  return (
    <span className="inline-flex">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className={animate ? "animate-char-wave" : ""}
          style={animate ? { animationDelay: `${i * 80}ms` } : undefined}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

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
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <span className="font-medium">
            <AnimatedText text={isThinking ? `${title}...` : title} animate={isThinking} />
          </span>
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
