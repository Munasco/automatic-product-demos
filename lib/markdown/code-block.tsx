"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { Check, Copy } from "lucide-react";
import { useAtomValue } from "jotai";
import { codeThemeAtom } from "@/stores/code-theme";
import { createHighlighter, type HighlighterCore } from "shiki";
import { ShikiMagicMove } from "shiki-magic-move/react";
import "shiki-magic-move/dist/style.css";

interface Props {
  code: string;
  lang: string;
}

// Singleton highlighter instance
let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [
        "github-dark-high-contrast",
        "github-dark",
        "github-dark-dimmed",
        "dark-plus",
        "vitesse-dark",
        "one-dark-pro",
        "dracula",
        "nord",
        "tokyo-night",
        "catppuccin-mocha",
        "material-theme-darker",
        "ayu-dark",
        "night-owl",
        "poimandres",
        "monokai",
        "slack-dark",
        "synthwave-84",
        "rose-pine-moon",
        "houston",
        "aurora-x",
        "everforest-dark",
      ],
      langs: [
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "json",
        "html",
        "css",
        "python",
        "rust",
        "go",
        "java",
        "c",
        "cpp",
        "csharp",
        "php",
        "ruby",
        "swift",
        "kotlin",
        "sql",
        "bash",
        "shell",
        "yaml",
        "markdown",
        "dockerfile",
        "graphql",
        "vue",
        "svelte",
        "zig",
        "elixir",
        "erlang",
        "haskell",
        "lua",
        "r",
        "scala",
        "clojure",
        "ocaml",
        "fsharp",
        "dart",
        "nim",
        "crystal",
        "julia",
        "toml",
        "ini",
        "xml",
        "scss",
        "sass",
        "less",
        "astro",
        "prisma",
        "tex",
        "latex",
        "text",
      ],
    });
  }
  return highlighterPromise;
}

function CodeBlockInner({ code, lang }: Props) {
  const [copied, setCopied] = useState(false);
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
  const theme = useAtomValue(codeThemeAtom);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="group my-4 overflow-hidden border border-[#30363d]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs text-zinc-400 font-mono">{lang || "text"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto text-sm [&>pre]:p-4 [&>pre]:m-0 [&_code]:font-mono [&_code]:leading-relaxed">
        {highlighter ? (
          <ShikiMagicMove
            lang={lang || "text"}
            theme={theme}
            highlighter={highlighter}
            code={code}
            options={{ duration: 300, stagger: 0 }}
          />
        ) : (
          <pre className="p-4 m-0 bg-[#0d1117]">
            <code className="font-mono leading-relaxed text-[#e6edf3]">{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

export const CodeBlock = memo(
  CodeBlockInner,
  (prev, next) => prev.code === next.code && prev.lang === next.lang
);
