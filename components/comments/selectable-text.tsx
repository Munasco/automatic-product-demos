"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { MessageSquarePlus, Sparkles } from "lucide-react";

interface Selection {
  start: number;
  end: number;
  text: string;
  rect: DOMRect;
}

interface Comment {
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  resolved: boolean;
}

interface SelectableTextProps {
  content: string;
  comments: Comment[];
  onAddComment: (
    start: number,
    end: number,
    text: string,
    comment: string
  ) => Promise<void>;
  onAskAI?: (selectedText: string) => void;
  onCommentClick?: (index: number) => void;
  activeCommentIndex?: number;
}

export function SelectableText({
  content,
  comments,
  onAddComment,
  onAskAI,
  onCommentClick,
  activeCommentIndex,
}: SelectableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      return;
    }

    const range = sel.getRangeAt(0);
    const container = containerRef.current;

    // Check if selection is within our container
    if (!container.contains(range.commonAncestorContainer)) {
      return;
    }

    const text = sel.toString().trim();
    if (!text) return;

    // Calculate offsets relative to the content
    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + text.length;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelection({
      start,
      end,
      text,
      rect: new DOMRect(
        rect.left - containerRect.left,
        rect.top - containerRect.top,
        rect.width,
        rect.height
      ),
    });
  }, []);

  const handleAddComment = async () => {
    if (!selection || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(
        selection.start,
        selection.end,
        selection.text,
        commentText
      );
      setSelection(null);
      setShowCommentInput(false);
      setCommentText("");
      window.getSelection()?.removeAllRanges();
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSelection = () => {
    setSelection(null);
    setShowCommentInput(false);
    setCommentText("");
    window.getSelection()?.removeAllRanges();
  };

  const handleAskAI = () => {
    if (!selection || !onAskAI) return;
    onAskAI(selection.text);
    cancelSelection();
  };

  // Render content with highlighted comments
  const renderHighlightedContent = () => {
    if (comments.length === 0) {
      return content;
    }

    // Sort comments by start position
    const sortedComments = [...comments].sort(
      (a, b) => a.selectionStart - b.selectionStart
    );

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    sortedComments.forEach((comment, index) => {
      // Add text before this comment
      if (comment.selectionStart > lastEnd) {
        parts.push(content.slice(lastEnd, comment.selectionStart));
      }

      // Add highlighted text
      const isActive = activeCommentIndex === index;
      parts.push(
        <mark
          key={`comment-${index}`}
          className={cn(
            "cursor-pointer transition-colors rounded px-0.5 -mx-0.5",
            comment.resolved
              ? "bg-foreground-muted/20"
              : isActive
                ? "bg-accent/40"
                : "bg-accent/20 hover:bg-accent/30"
          )}
          onClick={() => onCommentClick?.(index)}
        >
          {content.slice(comment.selectionStart, comment.selectionEnd)}
        </mark>
      );

      lastEnd = comment.selectionEnd;
    });

    // Add remaining text
    if (lastEnd < content.length) {
      parts.push(content.slice(lastEnd));
    }

    return parts;
  };

  return (
    <div className="relative" ref={containerRef} onMouseUp={handleMouseUp}>
      {/* Content with highlights */}
      <div className="whitespace-pre-wrap">{renderHighlightedContent()}</div>

      {/* Selection popup */}
      {selection && !showCommentInput && (
        <div
          className="absolute z-50 flex gap-1"
          style={{
            left: selection.rect.left + selection.rect.width / 2 - 80,
            top: selection.rect.top - 44,
          }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg"
            onClick={() => setShowCommentInput(true)}
          >
            <MessageSquarePlus className="size-4 mr-1" />
            Comment
          </Button>
          {onAskAI && (
            <Button
              size="sm"
              className="shadow-lg"
              onClick={handleAskAI}
            >
              <Sparkles className="size-4 mr-1" />
              Ask AI
            </Button>
          )}
        </div>
      )}

      {/* Comment input popup */}
      {selection && showCommentInput && (
        <div
          className="absolute z-50 w-72 bg-background-secondary border border-border rounded-lg p-3 shadow-lg"
          style={{
            left: Math.max(0, selection.rect.left),
            top: selection.rect.bottom + 8,
          }}
        >
          <div className="mb-2 text-xs text-foreground-muted">
            Commenting on: &ldquo;{selection.text.slice(0, 30)}
            {selection.text.length > 30 ? "..." : ""}&rdquo;
          </div>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px] text-sm mb-2"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancelSelection}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!commentText.trim() || isSubmitting}
            >
              Add Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
