"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { CommentThread } from "./comment-thread";
import { X, MessageSquare } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

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
  updatedAt: number;
  resolved: boolean;
  replies: CommentReply[];
}

interface CommentsPanelProps {
  comments: Comment[];
  isOpen: boolean;
  onClose: () => void;
  onReply: (commentId: Id<"comments">, content: string) => Promise<void>;
  onResolve: (commentId: Id<"comments">) => Promise<void>;
  onDelete: (commentId: Id<"comments">) => Promise<void>;
  activeCommentId?: Id<"comments">;
  onCommentClick?: (commentId: Id<"comments">) => void;
}

export function CommentsPanel({
  comments,
  isOpen,
  onClose,
  onReply,
  onResolve,
  onDelete,
  activeCommentId,
  onCommentClick,
}: CommentsPanelProps) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  const filteredComments = comments.filter((comment) => {
    if (filter === "open") return !comment.resolved;
    if (filter === "resolved") return comment.resolved;
    return true;
  });

  const openCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;

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
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-2 border-b border-border">
        <Button
          variant={filter === "all" ? "secondary" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setFilter("all")}
        >
          All ({comments.length})
        </Button>
        <Button
          variant={filter === "open" ? "secondary" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setFilter("open")}
        >
          Open ({openCount})
        </Button>
        <Button
          variant={filter === "resolved" ? "secondary" : "ghost"}
          size="sm"
          className="text-xs"
          onClick={() => setFilter("resolved")}
        >
          Resolved ({resolvedCount})
        </Button>
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted text-sm">
              {filter === "all"
                ? "No comments yet. Select text in a message to add a comment."
                : `No ${filter} comments.`}
            </div>
          ) : (
            filteredComments.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                onReply={onReply}
                onResolve={onResolve}
                onDelete={onDelete}
                isActive={activeCommentId === comment._id}
                onClick={() => onCommentClick?.(comment._id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
