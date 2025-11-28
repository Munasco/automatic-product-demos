"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  X,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  Code,
  FileText,
  Sparkles,
  RotateCcw,
  Undo2,
  Redo2,
} from "lucide-react";

interface CanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (content: string) => void;
  title?: string;
  language?: string;
  onAIEdit?: (instruction: string) => Promise<void>;
}

export function CanvasPanel({
  isOpen,
  onClose,
  content,
  onContentChange,
  title = "Untitled",
  language = "text",
  onAIEdit,
}: CanvasPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Track content changes for undo/redo
  useEffect(() => {
    if (content !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(content);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.${getExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onContentChange(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onContentChange(history[historyIndex + 1]);
    }
  };

  const handleAIEdit = async () => {
    if (!editInstruction.trim() || !onAIEdit) return;
    setIsAIEditing(true);
    try {
      await onAIEdit(editInstruction);
      setEditInstruction("");
    } finally {
      setIsAIEditing(false);
    }
  };

  const getLanguageIcon = () => {
    if (["js", "ts", "jsx", "tsx", "python", "go", "rust"].includes(language)) {
      return <Code className="size-4" />;
    }
    return <FileText className="size-4" />;
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background-sidebar border-l border-border transition-all duration-200",
        isFullscreen ? "fixed inset-0 z-50" : "h-full",
        isOpen ? (isFullscreen ? "w-full" : "w-[50%] min-w-[400px]") : "w-0 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-3 border-b border-border">
        <div className="flex items-center gap-2">
          {getLanguageIcon()}
          <span className="font-medium text-sm text-foreground">{title}</span>
          {language !== "text" && (
            <span className="text-xs text-foreground-muted px-1.5 py-0.5 bg-background-secondary rounded">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Redo"
          >
            <Redo2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleCopy}
            title="Copy"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className={cn(
            "h-full w-full resize-none rounded-none border-none bg-background font-mono text-sm",
            "focus:ring-0 focus:outline-none p-4"
          )}
          placeholder="Start typing or paste content here..."
          spellCheck={false}
        />
      </div>

      {/* AI Edit Bar */}
      {onAIEdit && (
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-accent" />
              <input
                type="text"
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAIEdit();
                  }
                }}
                placeholder="Ask AI to edit... (e.g., 'add error handling')"
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-background-secondary text-sm text-foreground placeholder:text-foreground-placeholder focus:outline-none focus:ring-1 focus:ring-accent"
                disabled={isAIEditing}
              />
            </div>
            <Button
              onClick={handleAIEdit}
              disabled={!editInstruction.trim() || isAIEditing}
              className="shrink-0"
            >
              {isAIEditing ? (
                <RotateCcw className="size-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between h-8 px-3 border-t border-border text-xs text-foreground-muted">
        <span>{content.split("\n").length} lines</span>
        <span>{content.length} characters</span>
      </div>
    </div>
  );
}

function getExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    rust: "rs",
    go: "go",
    java: "java",
    cpp: "cpp",
    c: "c",
    html: "html",
    css: "css",
    json: "json",
    markdown: "md",
    text: "txt",
  };
  return extensions[language] || "txt";
}
