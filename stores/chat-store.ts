"use client";

import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { nanoid } from "nanoid";
import type { Chat, Message } from "../types/chat";

// Initial sample chats for demo
const sampleChats: Chat[] = [
  {
    id: "1",
    title: "Understanding React Server Components",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Building a CLI tool with TypeScript",
    messages: [],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Optimizing database queries",
    messages: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

// Atoms
export const chatsAtom = atomWithStorage<Chat[]>("chats", sampleChats);
export const currentChatIdAtom = atomWithStorage<string | null>("currentChatId", null);

// Derived atom for current chat
export const currentChatAtom = atom((get) => {
  const chats = get(chatsAtom);
  const currentId = get(currentChatIdAtom);
  return chats.find((c) => c.id === currentId);
});

// Hook to use chat store
export function useChatStore() {
  const [chats, setChats] = useAtom(chatsAtom);
  const [currentChatId, setCurrentChatId] = useAtom(currentChatIdAtom);
  const currentChat = useAtomValue(currentChatAtom);

  const createChat = () => {
    const id = nanoid();
    const newChat: Chat = {
      id,
      title: "New chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(id);
    return id;
  };

  const updateChat = (id: string, updates: Partial<Chat>) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, ...updates, updatedAt: new Date() } : chat
      )
    );
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  };

  const setCurrentChat = (id: string | null) => {
    setCurrentChatId(id);
  };

  const addMessage = (
    chatId: string,
    message: Omit<Message, "id" | "createdAt">
  ) => {
    const newMessage: Message = {
      ...message,
      id: nanoid(),
      createdAt: new Date(),
    };

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;

        const shouldUpdateTitle =
          chat.messages.length === 0 && message.role === "user";

        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          title: shouldUpdateTitle
            ? message.content.slice(0, 50) +
              (message.content.length > 50 ? "..." : "")
            : chat.title,
          updatedAt: new Date(),
        };
      })
    );
  };

  const updateLastMessage = (chatId: string, content: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        const messages = [...chat.messages];
        if (messages.length > 0) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content,
          };
        }
        return { ...chat, messages };
      })
    );
  };

  const forkChat = (chatId: string, messageIndex: number): string => {
    const sourceChat = chats.find((c) => c.id === chatId);
    if (!sourceChat) return chatId;

    const newId = nanoid();
    const forkedMessages = sourceChat.messages.slice(0, messageIndex + 1);

    const newChat: Chat = {
      id: newId,
      title: `Fork: ${sourceChat.title}`,
      messages: forkedMessages.map((m) => ({ ...m, id: nanoid() })),
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: chatId,
      forkMessageIndex: messageIndex,
    };

    setChats((prev) => [
      newChat,
      ...prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, forkCount: (chat.forkCount || 0) + 1 }
          : chat
      ),
    ]);
    setCurrentChatId(newId);

    return newId;
  };

  const getCurrentChat = () => currentChat;

  return {
    chats,
    currentChatId,
    currentChat,
    createChat,
    updateChat,
    deleteChat,
    setCurrentChat,
    addMessage,
    updateLastMessage,
    forkChat,
    getCurrentChat,
  };
}
