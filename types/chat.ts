export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string; // Thinking traces from reasoning models
  createdAt: Date;
  forkId?: string; // If this message is a fork point
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  parentId?: string; // For forked chats
  forkMessageIndex?: number; // Index of the message where fork happened
  forkCount?: number; // Number of forks from this chat
}

export interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  addChat: (chat: Chat) => void;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  deleteChat: (id: string) => void;
  setCurrentChat: (id: string | null) => void;
  forkChat: (chatId: string, messageIndex: number) => string; // Returns new chat ID
}
