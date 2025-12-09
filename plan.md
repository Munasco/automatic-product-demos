# Identified useEffect Hooks

This document lists all `useEffect` hooks identified in the codebase and their purposes.

## 1. `lib/markdown/code-block.tsx`

- **Line 64**:
  ```typescript
  useEffect(() => {
    let active = true;
    highlight(code, lang).then((result) => {
      if (active) setHtml(result);
    });
    return () => { active = false; };
  }, [code, lang]);
  ```
  **Purpose**: Asynchronously highlights the code block content using `shiki` whenever the `code` or `lang` props change. It handles cleanup to prevent state updates on unmounted components.

## 2. `components/canvas/canvas-panel.tsx`

- **Line 49**:
  ```typescript
  useEffect(() => {
    if (content !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(content);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [content]);
  ```
  **Purpose**: Tracks changes to the `content` prop to maintain an undo/redo history stack.

## 3. `components/chat/chat-container.tsx`

- **Line 90**:
  ```typescript
  useEffect(() => {
    if (isLoading && !prevIsLoading.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);
  ```
  **Purpose**: Automatically scrolls the chat container to the bottom when the `isLoading` state changes to `true` (i.e., when a user sends a message and the AI starts responding).

## 4. `components/chat/chat-input.tsx`

- **Line 117**:
  ```typescript
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);
  ```
  **Purpose**: Auto-resizes the chat input textarea height based on the current `value` (text content) to fit the text, up to a maximum height.

## 5. `app/chat-page.tsx`

- **Line 44**:
  ```typescript
  useEffect(() => {
    if (initialChatId) {
      setCurrentChatId(initialChatId as Id<"chats">);
    } else {
      setCurrentChatId(null);
    }
  }, [initialChatId, setCurrentChatId]);
  ```
  **Purpose**: Synchronizes the `currentChatId` Jotai atom with the `initialChatId` prop passed to the page component.

- **Line 79**:
  ```typescript
  useEffect(() => {
    const wasStreaming = prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    if (wasStreaming && status === "ready") {
      // ... logic to save message and navigate ...
    }
    prevStatusRef.current = status;
  }, [status, messages, currentChatId, addMessage, router]);
  ```
  **Purpose**: Monitors the chat streaming status. When streaming completes (`status` goes from "streaming"/"submitted" to "ready"), it saves the assistant's generated message to the Convex backend and handles navigation to the new chat URL if applicable.
