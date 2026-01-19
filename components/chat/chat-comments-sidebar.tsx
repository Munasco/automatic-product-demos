"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { X, MessageSquare, Check, Reply, Trash2 } from "lucide-react";

interface CommentReply {
  _id: Id<"commentReplies">;
  content: string;
  author: string;
  createdAt: number;
}

interface Comment {
  _id: Id<"comments">;
  messageId: Id<"messages">;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  content: string;
  author: string;
  createdAt: number;
  resolved: boolean;
  replies: CommentReply[];
}

interface ChatCommentsSidebarProps {
  comments: Comment[];
  isOpen: boolean;
  onClose: () => void;
  pendingComment: { messageId: string; selectedText: string } | null;
  onClearPendingComment: () => void;
}

export function ChatCommentsSidebar({
  comments,
  isOpen,
  onClose,
  pendingComment,
  onClearPendingComment,
}: ChatCommentsSidebarProps) {
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  const createComment = useMutation(api.comments.create);
  const addReply = useMutation(api.comments.addReply);
  const toggleResolved = useMutation(api.comments.toggleResolved);
  const removeComment = useMutation(api.comments.remove);

  const handleSubmitComment = async () => {
    if (!pendingComment || !newCommentText.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment({
        messageId: pendingComment.messageId as Id<"messages">,
        selectionStart: 0,
        selectionEnd: pendingComment.selectedText.length,
        selectedText: pendingComment.selectedText,
        content: newCommentText,
        author: "You",
      });
      setNewCommentText("");
      onClearPendingComment();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (filter === "open") return !c.resolved;
    if (filter === "resolved") return c.resolved;
    return true;
  });

  const openCount = comments.filter((c) => !c.resolved).length;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background-sidebar border-l border-border transition-all duration-200",
        isOpen ? "w-80" : "w-0 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-foreground-muted" />
          <span className="font-medium text-foreground">Comments</span>
          {openCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-accent text-background rounded-full">
              {openCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-2 border-b border-border">
        {(["all", "open", "resolved"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "secondary" : "ghost"}
            size="sm"
            className="text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Pending comment input */}
      {pendingComment && (
        <div className="p-3 border-b border-border bg-accent/5">
          <div className="mb-2 px-2 py-1 bg-background-secondary rounded text-sm text-foreground-muted italic border-l-2 border-accent">
            &ldquo;{pendingComment.selectedText.slice(0, 60)}
            {pendingComment.selectedText.length > 60 ? "..." : ""}&rdquo;
          </div>
          <Textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add your comment..."
            className="min-h-[80px] text-sm mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newCommentText.trim() || isSubmitting}
            >
              Add Comment
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearPendingComment}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted text-sm">
              {comments.length === 0
                ? "No comments yet. Select text in a message to add a comment."
                : `No ${filter} comments.`}
            </div>
          ) : (
            filteredComments.map((comment) => (
              <CommentCard
                key={comment._id}
                comment={comment}
                onReply={addReply}
                onResolve={toggleResolved}
                onDelete={removeComment}
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
  onDelete,
}: {
  comment: Comment;
  onReply: (args: { commentId: Id<"comments">; content: string; author: string }) => Promise<unknown>;
  onResolve: (args: { commentId: Id<"comments"> }) => Promise<unknown>;
  onDelete: (args: { commentId: Id<"comments"> }) => Promise<unknown>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply({ commentId: comment._id, content: replyText, author: "You" });
      setReplyText("");
      setShowReply(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all",
        comment.resolved ? "opacity-60 border-border" : "border-accent/30"
      )}
    >
      {/* Selected text */}
      <div className="mb-2 px-2 py-1 bg-background-secondary rounded text-sm text-foreground-muted italic border-l-2 border-accent">
        &ldquo;{comment.selectedText.slice(0, 50)}
        {comment.selectedText.length > 50 ? "..." : ""}&rdquo;
      </div>

      {/* Author and content */}
      <div className="flex items-start gap-2">
        <div className="size-6 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-background">
          {comment.author[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author}</span>
            <span className="text-xs text-foreground-muted">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">{comment.content}</p>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l border-border pl-3">
          {comment.replies.map((reply) => (
            <div key={reply._id} className="text-sm">
              <span className="font-medium">{reply.author}:</span>
              <span className="text-foreground-secondary ml-1">{reply.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3">
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowReply(!showReply)}>
          <Reply className="size-3 mr-1" />
          Reply
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => onResolve({ commentId: comment._id })}
        >
          <Check className={cn("size-3 mr-1", comment.resolved && "text-accent")} />
          {comment.resolved ? "Resolved" : "Resolve"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs ml-auto text-foreground-muted hover:text-destructive"
          onClick={() => onDelete({ commentId: comment._id })}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {/* Reply input */}
      {showReply && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReply} disabled={!replyText.trim() || isSubmitting}>
              Reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReply(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
