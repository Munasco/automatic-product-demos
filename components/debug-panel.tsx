"use client";

import { useAtomValue } from "jotai";
import {
  selectedModelAtom,
  reasoningEffortAtom,
  webSearchAtom,
  shouldStreamAtom,
} from "@/stores/atoms";
import { useState } from "react";
import { Bug, X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const selectedModel = useAtomValue(selectedModelAtom);
  const reasoningEffort = useAtomValue(reasoningEffortAtom);
  const webSearch = useAtomValue(webSearchAtom);
  const shouldStream = useAtomValue(shouldStreamAtom);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 size-10 rounded-full bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg"
        size="icon"
      >
        <Bug className="size-5" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl font-mono text-xs",
        isMinimized ? "w-48" : "w-80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bug className="size-4 text-yellow-500" />
          <span className="font-semibold text-yellow-500">Debug</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-zinc-400 hover:text-white"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                !isMinimized && "rotate-90"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-zinc-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 space-y-2 max-h-96 overflow-auto">
          <StateRow label="Model" value={selectedModel.id} />
          <StateRow label="Reasoning" value={reasoningEffort} />
          <StateRow
            label="Web Search"
            value={webSearch}
            highlight={webSearch}
          />
          <StateRow
            label="Should Stream"
            value={shouldStream}
            highlight={shouldStream}
          />

          <div className="border-t border-zinc-700 pt-2 mt-2">
            <p className="text-zinc-500 text-[10px]">
              Press{" "}
              <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">
                Ctrl+Shift+D
              </kbd>{" "}
              to toggle
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StateRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: unknown;
  highlight?: boolean;
}) {
  const displayValue =
    typeof value === "boolean" ? (value ? "true" : "false") : String(value);

  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span
        className={cn(
          "px-2 py-0.5 rounded",
          highlight
            ? "bg-green-500/20 text-green-400"
            : "bg-zinc-800 text-zinc-300"
        )}
      >
        {displayValue}
      </span>
    </div>
  );
}
