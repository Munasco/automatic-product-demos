"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Check, Reply, Trash2 } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface CommentReply {
  _id: Id<"commentReplies">;
  content: string;
  author: string;
  createdAt: number;
}

interface Comment {
  _id: Id<"comments">;
  selectedText: string;
  content: string;
  author: string;
  createdAt: number;
  resolved: boolean;
  replies: CommentReply[];
}

interface CommentThreadProps {
  comment: Comment;
  onReply: (commentId: Id<"comments">, content: string) => Promise<void>;
  onResolve: (commentId: Id<"comments">) => Promise<void>;
  onDelete: (commentId: Id<"comments">) => Promise<void>;
  isActive?: boolean;
  onClick?: () => void;
}

export function CommentThread({
  comment,
  onReply,
  onResolve,
  onDelete,
  isActive = false,
  onClick,
}: CommentThreadProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(comment._id, replyContent);
      setReplyContent("");
      setShowReplyInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all cursor-pointer",
        isActive
          ? "border-accent bg-accent/5"
          : "border-border hover:border-border-input",
        comment.resolved && "opacity-60"
      )}
      onClick={onClick}
    >
      {/* Selected text preview */}
      <div className="mb-2 px-2 py-1 bg-background-secondary rounded text-sm text-foreground-muted italic border-l-2 border-accent">
        &ldquo;{comment.selectedText.length > 50
          ? comment.selectedText.slice(0, 50) + "..."
          : comment.selectedText}&rdquo;
      </div>

      {/* Main comment */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-background">
              {comment.author[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">
              {comment.author}
            </span>
            <span className="text-xs text-foreground-muted">
              {formatTime(comment.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={(e) => {
                e.stopPropagation();
                onResolve(comment._id);
              }}
              title={comment.resolved ? "Unresolve" : "Resolve"}
            >
              <Check
                className={cn(
                  "size-3.5",
                  comment.resolved ? "text-accent" : "text-foreground-muted"
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-foreground-muted hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(comment._id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-foreground pl-8">{comment.content}</p>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="pl-8 space-y-2 mt-3 border-l border-border ml-3">
            {comment.replies.map((reply) => (
              <div key={reply._id} className="pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-5 rounded-full bg-foreground-muted/20 flex items-center justify-center text-xs font-medium text-foreground-muted">
                    {reply.author[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {reply.author}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {formatTime(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground-secondary pl-7">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        {showReplyInput ? (
          <div className="pl-8 mt-2 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px] text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitReply();
                }}
                disabled={!replyContent.trim() || isSubmitting}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReplyInput(false);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="ml-8 text-foreground-muted"
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyInput(true);
            }}
          >
            <Reply className="size-3.5 mr-1" />
            Reply
          </Button>
        )}
      </div>
    </div>
  );
}
