"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { X, Reply, Check, Sparkles } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface CanvasCommentReply {
  _id: Id<"canvasCommentReplies">;
  content: string;
  author: string;
  isAI: boolean;
  createdAt: number;
}

interface CanvasComment {
  _id: Id<"canvasComments">;
  type: "inline" | "general";
  selectedText?: string;
  content: string;
  author: string;
  resolved: boolean;
  status?: "pending" | "reviewing";
  replies: CanvasCommentReply[];
}

interface CanvasCommentsPanelProps {
  comments: CanvasComment[];
  isOpen: boolean;
  onClose: () => void;
  onReply: (commentId: Id<"canvasComments">, content: string) => Promise<void>;
  onResolve: (commentId: Id<"canvasComments">) => Promise<void>;
  onRequestAIReply: (commentId: Id<"canvasComments">) => Promise<void>;
}

export function CanvasCommentsPanel({
  comments,
  isOpen,
  onClose,
  onReply,
  onResolve,
  onRequestAIReply,
}: CanvasCommentsPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background-sidebar border-l border-border transition-all duration-200",
        isOpen ? "w-80" : "w-0 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-medium text-foreground">Comments</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted text-sm">
              No comments yet. Select text or add a general comment.
            </div>
          ) : (
            comments.map((comment) => (
              <CommentCard
                key={comment._id}
                comment={comment}
                onReply={onReply}
                onResolve={onResolve}
                onRequestAIReply={onRequestAIReply}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
  onResolve,
  onRequestAIReply,
}: {
  comment: CanvasComment;
  onReply: (commentId: Id<"canvasComments">, content: string) => Promise<void>;
  onResolve: (commentId: Id<"canvasComments">) => Promise<void>;
  onRequestAIReply: (commentId: Id<"canvasComments">) => Promise<void>;
}) {
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

  return (
    <div
      className={cn(
        "border rounded-lg p-3",
        comment.resolved ? "opacity-60 border-border" : "border-accent/30"
      )}
    >
      {/* Type badge and selected text */}
      {comment.type === "inline" && comment.selectedText && (
        <div className="mb-2 px-2 py-1 bg-background-secondary rounded text-xs text-foreground-muted italic">
          &quot;{comment.selectedText.slice(0, 40)}{comment.selectedText.length > 40 ? "..." : ""}&quot;
        </div>
      )}

      {/* Main comment */}
      <div className="flex items-start gap-2 mb-2">
        <div className="size-6 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
          {comment.author[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{comment.author}</span>
            {comment.type === "general" && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                General
              </span>
            )}
          </div>
          <p className="text-sm text-foreground-secondary">{comment.content}</p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-8 space-y-2 border-l border-border pl-3 mb-2">
          {comment.replies.map((reply) => (
            <div key={reply._id} className="text-sm">
              <span className="font-medium text-xs">
                {reply.isAI && <Sparkles className="size-3 inline mr-1 text-accent" />}
                {reply.author}:
              </span>
              <span className="text-foreground-secondary ml-1">{reply.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setShowReplyInput(!showReplyInput)}
        >
          <Reply className="size-3 mr-1" />
          Reply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => onRequestAIReply(comment._id)}
        >
          <Sparkles className="size-3 mr-1" />
          Ask AI
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs ml-auto"
          onClick={() => onResolve(comment._id)}
        >
          <Check className={cn("size-3 mr-1", comment.resolved && "text-accent")} />
          {comment.resolved ? "Resolved" : "Resolve"}
        </Button>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitReply} disabled={!replyContent.trim() || isSubmitting}>
              Reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReplyInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
