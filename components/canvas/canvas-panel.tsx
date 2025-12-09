"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SelectableText } from "../comments/selectable-text";
import { CanvasCommentsPanel } from "./canvas-comments-panel";
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
  MessageSquarePlus,
  Send,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface CanvasComment {
  _id: Id<"canvasComments">;
  type: "inline" | "general";
  selectionStart?: number;
  selectionEnd?: number;
  selectedText?: string;
  content: string;
  author: string;
  resolved: boolean;
  status?: "pending" | "reviewing";
  replies: Array<{
    _id: Id<"canvasCommentReplies">;
    content: string;
    author: string;
    isAI: boolean;
    createdAt: number;
  }>;
}

interface CanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (content: string) => void;
  title?: string;
  language?: string;
  onAIEdit?: (instruction: string) => Promise<void>;
  canvasDocumentId?: Id<"canvasDocuments">;
  comments?: CanvasComment[];
  onAddInlineComment?: (
    start: number,
    end: number,
    text: string,
    comment: string
  ) => Promise<void>;
  onAddGeneralComment?: (comment: string) => Promise<void>;
  onReplyToComment?: (
    commentId: Id<"canvasComments">,
    content: string
  ) => Promise<void>;
  onToggleResolve?: (commentId: Id<"canvasComments">) => Promise<void>;
  onSubmitForReview?: () => Promise<void>;
  onRequestAIReply?: (commentId: Id<"canvasComments">) => Promise<void>;
}

export function CanvasPanel({
  isOpen,
  onClose,
  content,
  onContentChange,
  title = "Untitled",
  language = "text",
  onAIEdit,
  canvasDocumentId,
  comments = [],
  onAddInlineComment,
  onAddGeneralComment,
  onReplyToComment,
  onToggleResolve,
  onSubmitForReview,
  onRequestAIReply,
}: CanvasPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [history, setHistory] = useState<string[]>(() => [content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showGeneralCommentInput, setShowGeneralCommentInput] = useState(false);
  const [generalCommentText, setGeneralCommentText] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<
    Id<"canvasComments"> | undefined
  >();
  const [showCommentsPanel, setShowCommentsPanel] = useState(true);

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

  const handleUserEdit = (newContent: string) => {
    // User edit - add to history and update content
    setHistory((prevHistory) => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      return newHistory;
    });
    setHistoryIndex((prevIndex) => prevIndex + 1);
    onContentChange(newContent);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onContentChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onContentChange(history[newIndex]);
    }
  };

  const handleAIEdit = async () => {
    if (!editInstruction.trim() || !onAIEdit) return;
    setIsAIEditing(true);
    try {
      await onAIEdit(editInstruction);
      setEditInstruction("");
      // Note: AI edits update content via onContentChange callback
      // History for AI edits would need to be tracked separately if desired
    } finally {
      setIsAIEditing(false);
    }
  };

  const handleAddGeneralComment = async () => {
    if (!generalCommentText.trim() || !onAddGeneralComment) return;
    await onAddGeneralComment(generalCommentText);
    setGeneralCommentText("");
    setShowGeneralCommentInput(false);
  };

  const handleSubmitForReview = async () => {
    if (!onSubmitForReview) return;
    await onSubmitForReview();
  };

  const getLanguageIcon = () => {
    if (["js", "ts", "jsx", "tsx", "python", "go", "rust"].includes(language)) {
      return <Code className="size-4" />;
    }
    return <FileText className="size-4" />;
  };

  const pendingCommentsCount = comments.filter(
    (c) => c.status === "pending"
  ).length;
  const inlineComments = comments.filter((c) => c.type === "inline");

  return (
    <div
      className={cn(
        "flex bg-background-sidebar border-l border-border transition-all duration-200",
        isFullscreen ? "fixed inset-0 z-50" : "h-full",
        isOpen
          ? isFullscreen
            ? "w-full"
            : "w-[50%] min-w-[400px]"
          : "w-0 overflow-hidden"
      )}
    >
      <div className="flex flex-col flex-1">
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

            {/* General Comment Button */}
            {onAddGeneralComment && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-2"
                onClick={() =>
                  setShowGeneralCommentInput(!showGeneralCommentInput)
                }
              >
                <MessageSquarePlus className="size-3.5 mr-1" />
                General comment
              </Button>
            )}

            {/* Pending comments badge */}
            {pendingCommentsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">
                {pendingCommentsCount} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Submit for Review button */}
            {onSubmitForReview && pendingCommentsCount > 0 && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs mr-2"
                onClick={handleSubmitForReview}
              >
                <Send className="size-3.5 mr-1" />
                Submit {pendingCommentsCount} comment
                {pendingCommentsCount > 1 ? "s" : ""}
              </Button>
            )}

            {/* Edit mode toggle */}
            <Button
              variant={isEditMode ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs mr-1"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? "View" : "Edit"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleUndo}
              disabled={historyIndex === 0 || !isEditMode}
              title="Undo"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1 || !isEditMode}
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
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
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

        {/* General Comment Input */}
        {showGeneralCommentInput && (
          <div className="border-b border-border p-3 bg-background-secondary">
            <Textarea
              value={generalCommentText}
              onChange={(e) => setGeneralCommentText(e.target.value)}
              placeholder="Add a general comment about this document..."
              className="min-h-[80px] text-sm mb-2"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowGeneralCommentInput(false);
                  setGeneralCommentText("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddGeneralComment}
                disabled={!generalCommentText.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-auto">
          {isEditMode ? (
            <Textarea
              value={content}
              onChange={(e) => handleUserEdit(e.target.value)}
              className={cn(
                "h-full w-full resize-none rounded-none border-none bg-background font-mono text-sm",
                "focus:ring-0 focus:outline-none p-4"
              )}
              placeholder="Start typing or paste content here..."
              spellCheck={false}
            />
          ) : (
            <div className="p-4 font-mono text-sm">
              {onAddInlineComment ? (
                <SelectableText
                  content={content}
                  comments={inlineComments.map((c) => ({
                    selectionStart: c.selectionStart || 0,
                    selectionEnd: c.selectionEnd || 0,
                    selectedText: c.selectedText || "",
                    resolved: c.resolved,
                  }))}
                  onAddComment={onAddInlineComment}
                  onCommentClick={(index) => {
                    const comment = inlineComments[index];
                    if (comment) setActiveCommentId(comment._id);
                  }}
                  activeCommentIndex={inlineComments.findIndex(
                    (c) => c._id === activeCommentId
                  )}
                />
              ) : (
                <div className="whitespace-pre-wrap">{content}</div>
              )}
            </div>
          )}
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

      {/* Canvas Comments Panel */}
      {canvasDocumentId && (
        <CanvasCommentsPanel
          comments={comments}
          isOpen={showCommentsPanel}
          onClose={() => setShowCommentsPanel(false)}
          onReply={onReplyToComment || (async () => {})}
          onResolve={onToggleResolve || (async () => {})}
          onRequestAIReply={onRequestAIReply || (async () => {})}
        />
      )}
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
