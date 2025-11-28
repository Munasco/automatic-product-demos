"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { Check, Copy } from "lucide-react";

// Singleton highlighter - created once, reused everywhere
type Highlighter = Awaited<ReturnType<typeof import("shiki").createHighlighter>>;
let highlighter: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;
const loadedLangs = new Set<string>(["text", "plaintext"]);

async function getHighlighter(): Promise<Highlighter | null> {
  if (highlighter) return highlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = import("shiki").then(async (shiki) => {
    highlighter = await shiki.createHighlighter({
      themes: ["github-dark"],
      langs: ["javascript", "typescript", "python", "bash", "json", "html", "css"],
    });
    ["javascript", "typescript", "python", "bash", "json", "html", "css"].forEach((l) => loadedLangs.add(l));
    return highlighter;
  });

  return highlighterPromise;
}

async function highlight(code: string, lang: string): Promise<string | null> {
  try {
    const h = await getHighlighter();
    if (!h) return null;

    // Load language if not already loaded
    const normalizedLang = lang.toLowerCase() || "text";
    if (!loadedLangs.has(normalizedLang)) {
      try {
        await h.loadLanguage(normalizedLang as Parameters<typeof h.loadLanguage>[0]);
        loadedLangs.add(normalizedLang);
      } catch {
        // Language not supported, use text
      }
    }

    const safeLang = loadedLangs.has(normalizedLang) ? normalizedLang : "text";
    const html = h.codeToHtml(code, { lang: safeLang, theme: "github-dark" });

    // Extract just the code content
    const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

interface Props {
  code: string;
  lang: string;
}

export const CodeBlock = memo(function CodeBlock({ code, lang }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    highlight(code, lang).then((result) => {
      if (active) setHtml(result);
    });
    return () => { active = false; };
  }, [code, lang]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="group my-4 rounded-lg overflow-hidden bg-background-sidebar border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-background-secondary/50 border-b border-border">
        <span className="text-xs text-foreground-muted font-mono">{lang || "text"}</span>
        <button onClick={copy} className="p-1 rounded hover:bg-background-hover transition-colors">
          {copied ? (
            <Check size={14} className="text-accent" />
          ) : (
            <Copy size={14} className="text-foreground-muted" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed font-mono">
        {html ? (
          <code dangerouslySetInnerHTML={{ __html: html }} className="shiki" />
        ) : (
          <code className="text-foreground-secondary">{code}</code>
        )}
      </pre>
    </div>
  );
});
