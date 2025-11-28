"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider,
} from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Header } from "../components/chat/header";
import { ChatContainer } from "../components/chat/chat-container";
import type { AttachedFile } from "../components/chat/chat-input";
import { CommentsPanel } from "../components/comments/comments-panel";
import { CanvasPanel } from "../components/canvas/canvas-panel";
import { useChats, useChat as useConvexChat } from "../hooks/use-chats";
import { useMessages } from "../hooks/use-messages";
import { useChatComments } from "../hooks/use-comments";
import { useCanvas } from "../hooks/use-canvas";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { PenSquare, Search, GitFork, Settings } from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";
import type { Message } from "../types/chat";
import { currentChatIdAtom } from "../stores/chat-state";

interface ChatPageProps {
  initialChatId?: string;
}

export function ChatPage({ initialChatId }: ChatPageProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useAtom(currentChatIdAtom);

  useEffect(() => {
    if (initialChatId) {
      setCurrentChatId(initialChatId as Id<"chats">);
    } else {
      setCurrentChatId(null);
    }
  }, [initialChatId, setCurrentChatId]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<Id<"comments"> | undefined>();
  const [selectedModel, setSelectedModel] = useState("gpt-5.1");
  const [files, setFiles] = useState<AttachedFile[]>([]);

  const { chats, createChat, forkChat, updateTitle } = useChats();
  const { chat: currentChat, addMessage } = useConvexChat(currentChatId);
  const { messages: historyMessages, loadMore, status: historyStatus } = useMessages(currentChatId);
  const { comments } = useChatComments(currentChatId);
  const { document: canvasDocument, updateContent: updateCanvasContent, createOrUpdate: createOrUpdateCanvas } = useCanvas(currentChatId);

  const addReplyMutation = useMutation(api.comments.addReply);
  const toggleResolvedMutation = useMutation(api.comments.toggleResolved);
  const removeCommentMutation = useMutation(api.comments.remove);

  const chatTransport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { model: selectedModel } }),
    [selectedModel]
  );

  const { messages, sendMessage, status, stop } = useChat({ transport: chatTransport });
  const isLoading = status === "streaming" || status === "submitted";
  const prevStatusRef = useRef(status);
  const pendingChatIdRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Save AI message to Convex when streaming completes, then navigate
  useEffect(() => {
    const wasStreaming = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    if (wasStreaming && status === "ready") {
      // Reset submission guard
      isSubmittingRef.current = false;

      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "assistant") {
          const textParts = lastMessage.parts.filter((p): p is { type: "text"; text: string } => p.type === "text");
          const content = textParts.length > 0 ? textParts[textParts.length - 1].text : "";
          if (content && currentChatId) {
            // Save to Convex first, then navigate
            addMessage("assistant", content).then(() => {
              if (pendingChatIdRef.current) {
                router.push(`/c/${pendingChatIdRef.current}`);
                pendingChatIdRef.current = null;
              }
            });
          }
        }
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, currentChatId, addMessage, router]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() && files.length === 0) return;
    if (isSubmittingRef.current) return; // Prevent double submission
    isSubmittingRef.current = true;

    const userMessage = input;
    const currentFiles = files;
    setInput("");
    setFiles([]);

    let chatId = currentChatId;
    const isNewChat = !chatId;

    // Create chat in DB first if needed
    if (!chatId) {
      chatId = await createChat();
      setCurrentChatId(chatId);
      pendingChatIdRef.current = chatId;
    }

    // Convert files to base64 for storage
    const attachments = await Promise.all(
      currentFiles.map(async (f) => {
        const buffer = await f.file.arrayBuffer();
        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
        return { name: f.file.name, type: f.file.type, url: `data:${f.file.type};base64,${base64}` };
      })
    );

    // Store user message in Convex
    await addMessage("user", userMessage, chatId, attachments.length > 0 ? attachments : undefined);

    // Now send to AI SDK for streaming
    if (currentFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      currentFiles.forEach((f) => dataTransfer.items.add(f.file));
      sendMessage({ text: userMessage, files: dataTransfer.files });
    } else {
      sendMessage({ text: userMessage });
    }

    if (isNewChat) {
      fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })
        .then((res) => res.json())
        .then(({ title }) => { if (title && chatId) updateTitle(chatId, title); })
        .catch(() => {});
    }
  }, [input, files, currentChatId, createChat, addMessage, sendMessage, updateTitle, setCurrentChatId]);

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null);
    router.push("/");
  }, [router, setCurrentChatId]);

  const handleSelectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId as Id<"chats">);
    router.push(`/c/${chatId}`);
  }, [router, setCurrentChatId]);

  const handleFork = useCallback(async (messageIndex: number) => {
    if (currentChatId) {
      const newChatId = await forkChat(currentChatId, messageIndex);
      setCurrentChatId(newChatId);
      router.push(`/c/${newChatId}`);
    }
  }, [currentChatId, forkChat, router, setCurrentChatId]);

  // Convert history messages (from Convex) - these are fetched in desc order, so reverse
  const historyConverted: Message[] = useMemo(() => {
    return [...historyMessages].reverse().map((m) => ({
      id: m._id,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt),
    }));
  }, [historyMessages]);

  // Convert streaming messages (from AI SDK) - only get the assistant message for streaming
  const streamingAssistant: Message | null = useMemo(() => {
    const assistantMsg = messages.find((m) => m.role === "assistant");
    if (!assistantMsg) return null;

    const textParts = assistantMsg.parts.filter((p): p is { type: "text"; text: string } => p.type === "text");
    const reasoningParts = assistantMsg.parts.filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning");

    // Dedupe: get unique text content
    const uniqueTexts = [...new Set(textParts.map((p) => p.text))];
    const textContent = uniqueTexts.length > 0 ? uniqueTexts[uniqueTexts.length - 1] : "";
    const reasoningContent = reasoningParts.length > 0 ? reasoningParts[reasoningParts.length - 1].text : "";

    return {
      id: assistantMsg.id,
      role: "assistant" as const,
      content: textContent,
      reasoning: reasoningContent || undefined,
      createdAt: new Date(),
    };
  }, [messages]);

  // Display messages: history + streaming assistant (if any)
  const displayMessages: Message[] = useMemo(() => {
    if ((status === "streaming" || status === "submitted") && streamingAssistant) {
      return [...historyConverted, streamingAssistant];
    }
    return historyConverted;
  }, [historyConverted, streamingAssistant, status]);

  const sidebarChats = useMemo(() => chats.map((chat) => ({
    id: chat._id, title: chat.title, createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt), forkCount: chat.forkCount,
  })), [chats]);

  const filteredChats = sidebarChats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const groupedChats = groupChatsByDate(filteredChats);

  const handleCommentReply = useCallback(async (commentId: Id<"comments">, content: string) => {
    await addReplyMutation({ commentId, content, author: "You" });
  }, [addReplyMutation]);

  const handleCommentResolve = useCallback(async (commentId: Id<"comments">) => {
    await toggleResolvedMutation({ commentId });
  }, [toggleResolvedMutation]);

  const handleCommentDelete = useCallback(async (commentId: Id<"comments">) => {
    await removeCommentMutation({ commentId });
  }, [removeCommentMutation]);

  const canvasContent = canvasDocument?.content ?? "";
  const canvasTitle = canvasDocument?.title ?? "Untitled";
  const canvasLanguage = canvasDocument?.language ?? "text";

  const handleCanvasContentChange = useCallback(async (content: string) => {
    let chatId = currentChatId;
    if (!chatId) { chatId = await createChat(); setCurrentChatId(chatId); router.push(`/c/${chatId}`); }
    if (canvasDocument) await updateCanvasContent(content);
    else await createOrUpdateCanvas("Untitled", content, "text");
  }, [currentChatId, canvasDocument, updateCanvasContent, createOrUpdateCanvas, createChat, router, setCurrentChatId]);

  const formattedComments = useMemo(() => comments.map((c) => ({ ...c, replies: c.replies || [] })), [comments]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar>
        <SidebarHeader>
          <Button onClick={handleNewChat} className="w-full justify-start gap-2 bg-transparent hover:bg-background-hover text-foreground">
            <PenSquare className="size-4" /> New chat
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted" />
            <Input placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background-secondary border-none text-sm" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-full">
            {Object.entries(groupedChats).map(([group, groupChats]) => (
              <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupChats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton isActive={currentChatId === chat.id} onClick={() => handleSelectChat(chat.id)}>
                          <div className="flex min-w-0 grow items-center gap-2.5">
                            <div className="truncate" title={chat.title}>
                              <span className="text-white">{chat.title}</span>
                            </div>
                          </div>
                          {chat.forkCount && chat.forkCount > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-foreground-muted"><GitFork className="size-3" />{chat.forkCount}</span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            {filteredChats.length === 0 && <div className="px-4 py-8 text-center text-sm text-foreground-muted">{searchQuery ? "No chats found" : "No chats yet"}</div>}
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu><SidebarMenuItem><SidebarMenuButton><Settings className="size-4" /><span>Settings</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onNewChat={handleNewChat} />
        <div className="flex flex-1 overflow-hidden">
          <ChatContainer messages={displayMessages} input={input} onInputChange={setInput} onSubmit={handleSubmit}
            onStop={stop} onFork={handleFork} isLoading={isLoading} isLoadingHistory={currentChatId !== null && historyStatus === "LoadingFirstPage"} comments={comments} onToggleCanvas={() => setCanvasOpen(!canvasOpen)} onToggleComments={() => setCommentsOpen(!commentsOpen)} canvasOpen={canvasOpen} commentsOpen={commentsOpen} selectedModel={selectedModel} onModelChange={setSelectedModel} files={files} onFilesChange={setFiles} onLoadMore={loadMore} hasMore={historyStatus === "CanLoadMore"} />
          <CanvasPanel isOpen={canvasOpen} onClose={() => setCanvasOpen(false)} content={canvasContent} onContentChange={handleCanvasContentChange} title={canvasTitle} language={canvasLanguage} />
          <CommentsPanel comments={formattedComments} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} onReply={handleCommentReply} onResolve={handleCommentResolve} onDelete={handleCommentDelete} activeCommentId={activeCommentId} onCommentClick={setActiveCommentId} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface SidebarChat { id: string; title: string; createdAt: Date; updatedAt: Date; forkCount?: number; }

function groupChatsByDate(chats: SidebarChat[]): Record<string, SidebarChat[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 604800000);
  const lastMonth = new Date(today.getTime() - 2592000000);
  const groups: Record<string, SidebarChat[]> = {};
  chats.forEach((chat) => {
    const d = new Date(chat.updatedAt);
    const group = d >= today ? "Today" : d >= yesterday ? "Yesterday" : d >= lastWeek ? "Previous 7 days" : d >= lastMonth ? "Previous 30 days" : "Older";
    (groups[group] ??= []).push(chat);
  });
  return groups;
}
