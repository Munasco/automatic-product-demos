"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { Check, Copy } from "lucide-react";
import { useAtomValue } from "jotai";
import { codeThemeAtom } from "@/stores/code-theme";
import { codeToTokens, type ThemedToken, type BundledLanguage } from "shiki";

interface Props {
  code: string;
  lang: string;
}

interface TokenResult {
  tokens: ThemedToken[][];
  bg: string;
}

function CodeBlockInner({ code, lang }: Props) {
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<TokenResult | null>(null);
  const theme = useAtomValue(codeThemeAtom);

  useEffect(() => {
    console.log('[CodeBlock] useEffect triggered', { lang, codeLength: code.length, theme });
    let active = true;

    codeToTokens(code, { lang: (lang || "text") as BundledLanguage, theme })
      .then((res) => {
        console.log('[CodeBlock] codeToTokens resolved', { active, lines: res.tokens.length });
        if (active) {
          setResult({
            tokens: res.tokens,
            bg: res.bg || "#0d1117",
          });
        }
      })
      .catch((err) => {
        console.log('[CodeBlock] codeToTokens error', { active, err });
        if (active) {
          // Fallback - plain tokens
          setResult({
            tokens: code.split("\n").map((line) => [{ content: line, color: "#e6edf3" }] as ThemedToken[]),
            bg: "#0d1117",
          });
        }
      });

    return () => {
      console.log('[CodeBlock] cleanup', { lang, codeLength: code.length });
      active = false;
    };
  }, [code, lang, theme]);

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
      <pre className="p-4 overflow-x-auto text-sm m-0" style={{ background: result?.bg || "#0d1117" }}>
        <code className="font-mono leading-relaxed">
          {result ? (
            result.tokens.map((line, i) => (
              <span key={i}>
                {line.map((token, j) => (
                  <span key={j} style={{ color: token.color }}>
                    {token.content}
                  </span>
                ))}
                {i < result.tokens.length - 1 && "\n"}
              </span>
            ))
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  );
}

export const CodeBlock = memo(
  CodeBlockInner,
  (prev, next) => prev.code === next.code && prev.lang === next.lang
);
