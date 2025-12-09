# Refactor Plan: CodeBlock `useEffect`

## Analysis
The `useEffect` in `lib/markdown/code-block.tsx` is currently necessary because:
1.  **Asynchronous Dependency**: The syntax highlighting library (`shiki`) is asynchronous (`highlight` function returns a Promise).
2.  **Client-Side Rendering**: The component is a Client Component (`"use client"`), and React components must render synchronously. You cannot `await` inside the main render body of a Client Component.

```typescript
// Current Implementation
useEffect(() => {
  let active = true;
  highlight(code, lang).then((result) => {
    if (active) setHtml(result);
  });
  return () => { active = false; };
}, [code, lang]);
```

## Recommendation
While the side-effect is unavoidable (we must wait for the promise), we can improve the code structure by extracting this logic into a custom hook. This separates the *mechanism* of highlighting from the *rendering* of the block.

### Proposed Change: Extract `useHighlightedCode` Hook

Create a custom hook that handles the async state management, cleanup, and race conditions.

#### [NEW] `hooks/use-highlighted-code.ts`
```typescript
import { useState, useEffect } from "react";
import { highlight } from "../lib/markdown/code-block"; // We'll need to export 'highlight' or move it

export function useHighlightedCode(code: string, lang: string) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    // Reset to null immediately when code/lang changes to avoid showing stale highlights
    // Optional: keep stale while loading (transition)
    
    highlight(code, lang).then((result) => {
      if (active) setHtml(result);
    });

    return () => { active = false; };
  }, [code, lang]);

  return html;
}
```

#### [MODIFY] `lib/markdown/code-block.tsx`
```typescript
export const CodeBlock = memo(function CodeBlock({ code, lang }: Props) {
  const html = useHighlightedCode(code, lang);
  const [copied, setCopied] = useState(false);
  
  // ... rest of the component
```

## Alternative: React 19 `use` Hook (Experimental)
Since the project uses React 19, we *could* use `use(promise)`. However, this requires:
1.  Creating the promise outside the render cycle or memoizing it carefully.
2.  Handling Suspense boundaries (which might cause flickering during streaming).
3.  Given the streaming nature of the chat, the current `useEffect` (or custom hook) approach is actually more stable as it allows showing the plain text immediately while the highlight processes, preventing layout thrashing.

## Verification Plan
1.  **Manual Verification**:
    - Open the chat interface.
    - Send a message that generates code (e.g., "Write a Python hello world").
    - Verify that the code block renders.
    - Verify that syntax highlighting appears (it might pop in after a split second).
    - Verify that switching chats or rapid updates doesn't cause errors (race conditions).
