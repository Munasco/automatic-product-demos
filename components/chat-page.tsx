"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import type { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { ChatContainer } from "./chat/chat-container";
import { CanvasPanel } from "./canvas/canvas-panel";
import { DebugPanel } from "./debug-panel";
import { ThinkingSidebar, type ThinkingSession } from "./chat/thinking-sidebar";
import { ChatCommentsSidebar } from "./chat/chat-comments-sidebar";
import { useChats } from "../hooks/use-chats";
import { useStreamChat } from "../hooks/use-stream-chat";
import { useCanvas } from "../hooks/use-canvas";
import { useCanvasComments } from "../hooks/use-canvas-comments";
import { useChatComments } from "../hooks/use-comments";
import type { AttachedFile } from "./chat/chat-input";
import { Button } from "./ui/button";
import { useAtom } from "jotai";
import {
  selectedModelAtom,
  reasoningEffortAtom,
  webSearchAtom,
} from "../stores/atoms";
import { cn } from "../lib/utils";
import {
  PenSquare,
  MessageSquare,
  MoreHorizontal,
  Share,
  Users,
  Pencil,
  FolderInput,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "./ui/sidebar";

// Get time segment for grouping
function getTimeSegment(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);
  const lastMonth = new Date(today.getTime() - 30 * 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= lastWeek) return "Previous 7 days";
  if (date >= lastMonth) return "Previous 30 days";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Group chats by time segment
function groupChatsByTime(
  chats: Array<{
    _id: string;
    title: string;
    updatedAt: number;
    messageCount?: number;
  }>
) {
  const groups: Record<string, typeof chats> = {};
  const order = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days"];

  for (const chat of chats) {
    const segment = getTimeSegment(chat.updatedAt);
    if (!groups[segment]) {
      groups[segment] = [];
    }
    groups[segment].push(chat);
  }

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  return sortedKeys.map((key) => ({ label: key, chats: groups[key] }));
}

export function ChatPage({ chatId }: { chatId?: Id<"chats"> | undefined }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [reasoningEffort, setReasoningEffort] = useAtom(reasoningEffortAtom);
  const [webSearch, setWebSearch] = useAtom(webSearchAtom);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [canvasContent, setCanvasContent] = useState("");
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [commentsSidebarOpen, setCommentsSidebarOpen] = useState(false);
  const [thinkingSidebarOpen, setThinkingSidebarOpen] = useState(false);
  const [thinkingSessions, setThinkingSessions] = useState<ThinkingSession[]>(
    []
  );
  const [thinkingTotalTime, setThinkingTotalTime] = useState(0);
  const [pendingComment, setPendingComment] = useState<{
    messageId: string;
    selectedText: string;
  } | null>(null);

  // Get chat list from Convex
  const { chats, isLoadingMore, canLoadMore, loadMore, removeChat } =
    useChats();

  // Ref for scroll detection
  const sidebarContentRef = useRef<HTMLDivElement>(null);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!sidebarContentRef.current || isLoadingMore || !canLoadMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = sidebarContentRef.current;

    // Load more when user is within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [isLoadingMore, canLoadMore, loadMore]);

  // Add scroll event listener
  useEffect(() => {
    const sidebarContent = sidebarContentRef.current;
    if (!sidebarContent) {
      return;
    }

    sidebarContent.addEventListener("scroll", handleScroll);
    return () => sidebarContent.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Use stream chat hook for messaging
  const {
    messages,
    streamUrl,
    sendMessage,
    createChatAndSend,
    stop,
    threadIsStreaming: isStreaming,
    isLoadingChatHistory,
  } = useStreamChat({
    chatId: chatId ?? null,
    model: selectedModel,
    reasoningEffort:
      selectedModel.id === "gpt-5.1" ? reasoningEffort : undefined,
    webSearch,
  });

  // Canvas hooks
  const {
    document: canvasDocument,
    createOrUpdate: createOrUpdateCanvas,
    updateContent: updateCanvasContent,
  } = useCanvas(chatId ?? null);
  const {
    comments: canvasComments,
    addInlineComment,
    addGeneralComment,
    replyToComment,
    toggleResolve,
    submitForReview,
    requestAIReply,
  } = useCanvasComments(canvasDocument?._id ?? null, canvasContent);

  // Chat comments hook
  const { comments: chatComments, unresolvedCount: unresolvedCommentCount } =
    useChatComments(chatId ?? null);

  // Edit message mutation - deletes from edited message onward and resends
  const removeMessageMutation = useMutation(api.messages.remove);

  // Reset canvas content when document changes using key-based approach
  // This avoids useEffect and setState issues
  const canvasKey = canvasDocument?._id || "new";
  const currentCanvasContent = canvasDocument?.content || "";
  const displayCanvasContent = canvasDocument
    ? currentCanvasContent
    : canvasContent;

  // Handle canvas content change
  const handleCanvasContentChange = useCallback(
    async (content: string) => {
      setCanvasContent(content);
      if (canvasDocument) {
        await updateCanvasContent(content);
      } else if (chatId) {
        await createOrUpdateCanvas("Untitled", content, "text");
      }
    },
    [canvasDocument, chatId, updateCanvasContent, createOrUpdateCanvas]
  );

  // Handle Ask AI from canvas selection
  const handleAskAI = useCallback((selectedText: string) => {
    const prompt = `Regarding the following text from the canvas:\n\n"${selectedText}"\n\nPlease provide a detailed explanation. If this requires a lengthy response, please indicate that upfront.`;
    setInputValue(prompt);
  }, []);

  // Handle Comment on message selection - opens sidebar with pending comment
  const handleMessageComment = useCallback(
    (messageId: string, selectedText: string) => {
      setPendingComment({ messageId, selectedText });
      setCommentsSidebarOpen(true);
    },
    []
  );

  // Handle opening thinking sidebar
  const handleOpenThinkingSidebar = useCallback(
    (sessions: ThinkingSession[], totalTime: number) => {
      setThinkingSessions(sessions);
      setThinkingTotalTime(totalTime);
      setThinkingSidebarOpen(true);
    },
    []
  );

  // Handle editing a message - delete from this message onward and resend
  const handleEditMessage = useCallback(
    async (messageId: string, content: string) => {
      // Find the edited message and its index
      const editIndex = messages.findIndex(
        (m: { id: string }) => m.id === messageId
      );
      if (editIndex === -1) {
        console.error(
          `ChatPage: Cannot edit message - message with ID ${messageId} not found`
        );
        return;
      }

      const editedMessage = messages[editIndex];
      const newEditVersion = (editedMessage.editVersion || 1) + 1;

      // Delete all messages from this index onward (including the edited one)
      const messagesToDelete = messages.slice(editIndex);
      await Promise.all(
        messagesToDelete.map((m: { id: string }) =>
          removeMessageMutation({ messageId: m.id as Id<"messages"> })
        )
      );

      // Send the edited content as a new message with incremented version
      await sendMessage(content, newEditVersion);
    },
    [messages, removeMessageMutation, sendMessage]
  );

  const navigateToChatThread = useCallback(
    (newChatId: Id<"chats"> | null) => {
      const url = newChatId ? `/c/${newChatId}` : "/";

      router.push(url);
    },
    [router]
  );

  // Handle Ask AI on message selection - immediately sends the message
  const handleMessageAskAI = useCallback(
    async (selectedText: string) => {
      const prompt = `Regarding: "${selectedText}"\n\nPlease explain this in detail.`;
      if (!chatId) {
        const newChatId = await createChatAndSend(prompt);
        navigateToChatThread(newChatId);
      } else {
        await sendMessage(prompt);
      }
    },
    [chatId, createChatAndSend, sendMessage, navigateToChatThread]
  );

  // Handle new chat button
  const handleNewChat = useCallback(() => {
    setInputValue("");
    setFiles([]);
    navigateToChatThread(null);
  }, [navigateToChatThread]);

  // Handle chat selection
  const handleSelectChat = useCallback(
    (selectedChatId: Id<"chats">) => {
      navigateToChatThread(selectedChatId);
    },
    [navigateToChatThread]
  );

  // Handle chat deletion
  const handleDeleteChat = useCallback(
    async (e: React.MouseEvent, deleteChatId: Id<"chats">) => {
      e.stopPropagation();
      await removeChat(deleteChatId);
      if (chatId === deleteChatId) {
        navigateToChatThread(null);
      }
    },
    [removeChat, chatId, navigateToChatThread]
  );

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) {
      console.error(
        "ChatPage: Cannot submit - input empty or already streaming"
      );
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");

    if (!chatId) {
      const newChatId = await createChatAndSend(userMessage);
      navigateToChatThread(newChatId);
    } else {
      await sendMessage(userMessage);
    }
  }, [
    inputValue,
    isStreaming,
    chatId,
    createChatAndSend,
    sendMessage,
    navigateToChatThread,
  ]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar>
        <SidebarHeader>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleNewChat}
          >
            <PenSquare className="size-4" />
            New chat
          </Button>
        </SidebarHeader>

        <SidebarContent ref={sidebarContentRef}>
          {chats.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-foreground-muted">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <>
              {groupChatsByTime(chats).map((group) => (
                <SidebarGroup key={group.label}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarMenu>
                    {group.chats.map((chat) => (
                      <SidebarMenuItem
                        key={chat._id}
                        className={cn(
                          "rounded-lg flex group w-full transition-colors",
                          chatId === chat._id
                            ? "bg-background-hover text-foreground"
                            : "hover:bg-background-hover"
                        )}
                      >
                        <div className="flex w-full items-center justify-between pr-2">
                          <Button
                            variant="ghost"
                            className="max-w-11/12 px-2 py-3 text-sm transition-colors justify-start hover:bg-transparent"
                            onClick={() =>
                              handleSelectChat(chat._id as Id<"chats">)
                            }
                          >
                            <span className="flex-1 truncate text-start overflow-hidden text-ellipsis whitespace-nowrap">
                              {chat.title}
                            </span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 opacity-0 group-hover:opacity-100 hover:bg-transparent transition-opacity"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem>
                                <Share className="size-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="size-4 mr-2" />
                                Start a group chat
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Pencil className="size-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <FolderInput className="size-4 mr-2" />
                                  Move to project
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem>Project 1</DropdownMenuItem>
                                  <DropdownMenuItem>Project 2</DropdownMenuItem>
                                  <DropdownMenuItem>
                                    New project...
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuItem>
                                <Archive className="size-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChat(
                                    e as unknown as React.MouseEvent,
                                    chat._id as Id<"chats">
                                  );
                                }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
              {isLoadingMore && (
                <div className="px-3 py-2 text-sm text-foreground-muted text-center">
                  Loading more chats...
                </div>
              )}
            </>
          )}
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-row h-screen">
        <div className="flex flex-col flex-1 min-w-0">
          <ChatContainer
            messages={messages}
            streamUrl={streamUrl}
            input={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={stop}
            onEditMessage={handleEditMessage}
            onComment={handleMessageComment}
            onAskAI={handleMessageAskAI}
            isStreaming={isStreaming}
            isLoadingHistory={isLoadingChatHistory}
            selectedModel={selectedModel}
            onModelChange={(model) => setSelectedModel(model)}
            reasoningEffort={reasoningEffort}
            onReasoningEffortChange={setReasoningEffort}
            files={files}
            onFilesChange={setFiles}
            webSearch={webSearch}
            onWebSearchChange={setWebSearch}
            onToggleCanvas={() => setCanvasOpen(!canvasOpen)}
            canvasOpen={canvasOpen}
            onToggleComments={() =>
              setCommentsSidebarOpen(!commentsSidebarOpen)
            }
            commentsOpen={commentsSidebarOpen}
            commentCount={unresolvedCommentCount}
            onOpenThinkingSidebar={handleOpenThinkingSidebar}
          />
        </div>
        <CanvasPanel
          key={canvasKey}
          isOpen={canvasOpen}
          onClose={() => setCanvasOpen(false)}
          content={displayCanvasContent}
          onContentChange={handleCanvasContentChange}
          title={canvasDocument?.title || "Untitled"}
          language={canvasDocument?.language || "text"}
          canvasDocumentId={canvasDocument?._id}
          comments={canvasComments}
          onAddInlineComment={addInlineComment}
          onAddGeneralComment={addGeneralComment}
          onReplyToComment={replyToComment}
          onToggleResolve={toggleResolve}
          onSubmitForReview={submitForReview}
          onRequestAIReply={requestAIReply}
          onAskAI={handleAskAI}
        />
        <ThinkingSidebar
          sessions={thinkingSessions}
          totalTime={thinkingTotalTime}
          isOpen={thinkingSidebarOpen}
          onClose={() => setThinkingSidebarOpen(false)}
        />
        <ChatCommentsSidebar
          comments={chatComments}
          isOpen={commentsSidebarOpen}
          onClose={() => setCommentsSidebarOpen(false)}
          pendingComment={pendingComment}
          onClearPendingComment={() => setPendingComment(null)}
        />
      </SidebarInset>
      <DebugPanel />
    </SidebarProvider>
  );
}
