import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export function useCanvasComments(canvasDocumentId: Id<"canvasDocuments"> | null, canvasContent?: string) {
  const comments = useQuery(
    api.canvasComments.listByCanvas,
    canvasDocumentId ? { canvasDocumentId } : "skip"
  );

  const createInlineMutation = useMutation(api.canvasComments.createInline);
  const createGeneralMutation = useMutation(api.canvasComments.createGeneral);
  const addReplyMutation = useMutation(api.canvasComments.addReply);
  const toggleResolvedMutation = useMutation(api.canvasComments.toggleResolved);
  const submitForReviewMutation = useMutation(api.canvasComments.submitForReview);
  const addAIReplyAction = useAction(api.canvasComments.addAIReply);

  return {
    comments: comments || [],

    addInlineComment: async (start: number, end: number, text: string, content: string) => {
      if (!canvasDocumentId) return;
      await createInlineMutation({
        canvasDocumentId,
        selectionStart: start,
        selectionEnd: end,
        selectedText: text,
        content,
        author: "You",
      });
    },

    addGeneralComment: async (content: string) => {
      if (!canvasDocumentId) return;
      await createGeneralMutation({
        canvasDocumentId,
        content,
        author: "You",
      });
    },

    replyToComment: async (commentId: Id<"canvasComments">, content: string) => {
      await addReplyMutation({
        commentId,
        content,
        author: "You",
      });
    },

    toggleResolve: async (commentId: Id<"canvasComments">) => {
      await toggleResolvedMutation({ commentId });
    },

    submitForReview: async () => {
      if (!canvasDocumentId) return;
      await submitForReviewMutation({ canvasDocumentId });
    },

    requestAIReply: async (commentId: Id<"canvasComments">) => {
      const comment = comments?.find((c) => c._id === commentId);
      if (!comment) return;

      await addAIReplyAction({
        commentId,
        commentContent: comment.content,
        selectedText: comment.selectedText,
        canvasContent: canvasContent || "",
      });
    },
  };
}
