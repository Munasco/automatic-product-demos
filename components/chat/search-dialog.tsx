"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquare, X, Sparkles, Type } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useSearch,
  useRagSearch,
  type SearchResult,
  type SearchMode,
} from "@/hooks/use-search";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("keyword");
  const { results: keywordResults, isSearching: isKeywordSearching } =
    useSearch(query, mode);
  const {
    results: ragResults,
    isSearching: isRagSearching,
    search: ragSearch,
  } = useRagSearch();
  const router = useRouter();

  // Trigger RAG search when mode is semantic and query changes
  useEffect(() => {
    if (mode === "semantic" && query.trim()) {
      const timer = setTimeout(() => {
        ragSearch(query);
      }, 500); // Longer debounce for RAG as it's more expensive
      return () => clearTimeout(timer);
    }
  }, [query, mode, ragSearch]);

  const results = mode === "keyword" ? keywordResults : ragResults;
  const isSearching = mode === "keyword" ? isKeywordSearching : isRagSearching;

  const handleSelect = useCallback(
    (result: SearchResult) => {
      router.push(`/c/${result.chatId}`);
      onOpenChange(false);
      setQuery("");
    },
    [router, onOpenChange]
  );

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const truncateContent = (content: string, query: string, maxLength = 150) => {
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1 || content.length <= maxLength) {
      return (
        content.slice(0, maxLength) + (content.length > maxLength ? "..." : "")
      );
    }

    // Show content around the query match
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(content.length, queryIndex + query.length + 100);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < content.length ? "..." : "";

    return prefix + content.slice(start, end) + suffix;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-foreground-muted" />
            <Input
              placeholder={
                mode === "keyword" ? "Search chats..." : "Semantic search..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0 text-base"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                onClick={() => setQuery("")}
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            )}
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
              <button
                onClick={() => setMode("keyword")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  mode === "keyword"
                    ? "bg-accent/20 text-accent"
                    : "text-foreground-muted hover:text-foreground"
                )}
                title="Keyword search"
              >
                <Type className="size-4" />
              </button>
              <button
                onClick={() => setMode("semantic")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  mode === "semantic"
                    ? "bg-accent/20 text-accent"
                    : "text-foreground-muted hover:text-foreground"
                )}
                title="Semantic search (AI)"
              >
                <Sparkles className="size-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center text-foreground-muted">
              {mode === "keyword" ? (
                <>
                  <Search className="size-8 mx-auto mb-2 opacity-50" />
                  <p>Type to search your chats</p>
                </>
              ) : (
                <>
                  <Sparkles className="size-8 mx-auto mb-2 opacity-50" />
                  <p>Search by meaning with AI</p>
                  <p className="text-xs mt-1">
                    Finds semantically similar content
                  </p>
                </>
              )}
            </div>
          ) : isSearching ? (
            <div className="px-4 py-8 text-center text-foreground-muted">
              <div className="flex items-center justify-center gap-2">
                <div className="size-2 bg-foreground-muted rounded-full animate-pulse" />
                <div className="size-2 bg-foreground-muted rounded-full animate-pulse [animation-delay:150ms]" />
                <div className="size-2 bg-foreground-muted rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-foreground-muted">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-background-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="size-4 mt-1 text-foreground-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {result.chatTitle}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            result.role === "user"
                              ? "bg-accent/20 text-accent"
                              : "bg-foreground-muted/20 text-foreground-muted"
                          )}
                        >
                          {result.role}
                        </span>
                        {mode === "semantic" && result.score !== undefined && (
                          <span className="text-xs text-foreground-muted">
                            {Math.round(result.score * 100)}% match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted line-clamp-2">
                        {highlightMatch(
                          truncateContent(result.content, query),
                          query
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
