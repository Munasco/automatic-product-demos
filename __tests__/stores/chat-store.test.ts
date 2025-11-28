import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore } from "jotai";
import { chatsAtom, currentChatIdAtom } from "../../stores/chat-store";
import type { Chat } from "../../types/chat";

describe("Chat Store - Jotai Atoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  describe("chatsAtom", () => {
    it("should initialize with sample chats", () => {
      const chats = store.get(chatsAtom);
      expect(chats).toHaveLength(3);
      expect(chats[0].title).toBe("Understanding React Server Components");
    });

    it("should allow adding a new chat", () => {
      const newChat: Chat = {
        id: "new-chat-id",
        title: "New Test Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.set(chatsAtom, (prev) => [newChat, ...prev]);
      const chats = store.get(chatsAtom);

      expect(chats).toHaveLength(4);
      expect(chats[0].id).toBe("new-chat-id");
    });

    it("should allow updating a chat", () => {
      const chats = store.get(chatsAtom);
      const chatToUpdate = chats[0];

      store.set(chatsAtom, (prev) =>
        prev.map((chat) =>
          chat.id === chatToUpdate.id
            ? { ...chat, title: "Updated Title" }
            : chat
        )
      );

      const updatedChats = store.get(chatsAtom);
      expect(updatedChats[0].title).toBe("Updated Title");
    });

    it("should allow deleting a chat", () => {
      const chats = store.get(chatsAtom);
      const chatToDelete = chats[0];

      store.set(chatsAtom, (prev) =>
        prev.filter((chat) => chat.id !== chatToDelete.id)
      );

      const remainingChats = store.get(chatsAtom);
      expect(remainingChats).toHaveLength(2);
      expect(remainingChats.find((c) => c.id === chatToDelete.id)).toBeUndefined();
    });
  });

  describe("currentChatIdAtom", () => {
    it("should initialize as null", () => {
      const currentId = store.get(currentChatIdAtom);
      expect(currentId).toBeNull();
    });

    it("should allow setting current chat id", () => {
      store.set(currentChatIdAtom, "chat-1");
      expect(store.get(currentChatIdAtom)).toBe("chat-1");
    });

    it("should allow clearing current chat id", () => {
      store.set(currentChatIdAtom, "chat-1");
      store.set(currentChatIdAtom, null);
      expect(store.get(currentChatIdAtom)).toBeNull();
    });
  });

  describe("Chat operations", () => {
    it("should add messages to a chat", () => {
      const chats = store.get(chatsAtom);
      const chatId = chats[0].id;

      const newMessage = {
        id: "msg-1",
        role: "user" as const,
        content: "Hello, world!",
        createdAt: new Date(),
      };

      store.set(chatsAtom, (prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, newMessage] }
            : chat
        )
      );

      const updatedChats = store.get(chatsAtom);
      const targetChat = updatedChats.find((c) => c.id === chatId);
      expect(targetChat?.messages).toHaveLength(1);
      expect(targetChat?.messages[0].content).toBe("Hello, world!");
    });

    it("should fork a chat correctly", () => {
      // First add some messages
      const chats = store.get(chatsAtom);
      const sourceChat = chats[0];

      const messages = [
        { id: "msg-1", role: "user" as const, content: "First message", createdAt: new Date() },
        { id: "msg-2", role: "assistant" as const, content: "Response", createdAt: new Date() },
        { id: "msg-3", role: "user" as const, content: "Second message", createdAt: new Date() },
      ];

      store.set(chatsAtom, (prev) =>
        prev.map((chat) =>
          chat.id === sourceChat.id ? { ...chat, messages } : chat
        )
      );

      // Fork at message index 1 (should include msg-1 and msg-2)
      const forkMessageIndex = 1;
      const forkedMessages = messages.slice(0, forkMessageIndex + 1);

      const forkedChat: Chat = {
        id: "forked-chat-id",
        title: `Fork: ${sourceChat.title}`,
        messages: forkedMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: sourceChat.id,
        forkMessageIndex,
      };

      store.set(chatsAtom, (prev) => [
        forkedChat,
        ...prev.map((chat) =>
          chat.id === sourceChat.id
            ? { ...chat, forkCount: (chat.forkCount || 0) + 1 }
            : chat
        ),
      ]);

      const updatedChats = store.get(chatsAtom);
      const newForkedChat = updatedChats.find((c) => c.id === "forked-chat-id");
      const originalChat = updatedChats.find((c) => c.id === sourceChat.id);

      expect(newForkedChat).toBeDefined();
      expect(newForkedChat?.messages).toHaveLength(2);
      expect(newForkedChat?.parentId).toBe(sourceChat.id);
      expect(originalChat?.forkCount).toBe(1);
    });

    it("should update chat title from first user message", () => {
      const newChat: Chat = {
        id: "empty-chat",
        title: "New chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.set(chatsAtom, (prev) => [newChat, ...prev]);

      const firstMessage = {
        id: "first-msg",
        role: "user" as const,
        content: "This is a very long message that should be truncated for the title",
        createdAt: new Date(),
      };

      store.set(chatsAtom, (prev) =>
        prev.map((chat) => {
          if (chat.id !== "empty-chat") return chat;
          const shouldUpdateTitle = chat.messages.length === 0;
          return {
            ...chat,
            messages: [firstMessage],
            title: shouldUpdateTitle
              ? firstMessage.content.slice(0, 50) + "..."
              : chat.title,
          };
        })
      );

      const updatedChats = store.get(chatsAtom);
      const targetChat = updatedChats.find((c) => c.id === "empty-chat");
      expect(targetChat?.title).toBe("This is a very long message that should be truncat...");
    });
  });
});
