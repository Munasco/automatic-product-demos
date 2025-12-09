"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Check, Copy } from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MarkdownProps {
  content: string;
  className?: string;
}

// Render LaTeX math expressions using KaTeX
function renderMath(content: string): string {
  // Render display math: \[...\] or $$...$$
  let result = content.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, g1, g2) => {
    const math = g1 || g2;
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="text-red-500">[Math Error]</span>`;
    }
  });

  // Render inline math: \(...\) or $...$
  result = result.replace(/\\\(([\s\S]*?)\\\)|\$([^\$\n]+?)\$/g, (_, g1, g2) => {
    const math = g1 || g2;
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="text-red-500">[Math Error]</span>`;
    }
  });

  return result;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-xs text-zinc-400">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy code
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export const Markdown = memo(function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <div className={`text-base leading-7 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold mt-6 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-4 mb-2">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 last:mb-0">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 space-y-2 list-disc">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 space-y-2 list-decimal">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1">{children}</li>
          ),

          // Inline code
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            const codeString = String(children).replace(/\n$/, "");

            if (isBlock) {
              return <CodeBlock className={className}>{codeString}</CodeBlock>;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[13px] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Pre - let code handle it
          pre: ({ children }) => <>{children}</>,

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="mb-4 pl-4 border-l-4 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-100 dark:bg-zinc-800">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold border border-zinc-300 dark:border-zinc-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border border-zinc-300 dark:border-zinc-600">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-700" />,

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),

          // Images
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt || ""} className="rounded-lg max-w-full my-4" />
          ),
        }}
      >
        {renderMath(content)}
      </ReactMarkdown>
    </div>
  );
});

export { Markdown as default };
