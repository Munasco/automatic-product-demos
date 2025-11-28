"use client";

import { memo, useMemo } from "react";
import type { Token } from "./types";
import { parse } from "./parser";
import { Inline } from "./inline";
import { CodeBlock } from "./code-block";

const HEADING_CLASSES: Record<number, string> = {
  1: "text-2xl font-bold mt-6 mb-4",
  2: "text-xl font-bold mt-5 mb-3",
  3: "text-lg font-semibold mt-4 mb-2",
  4: "text-base font-semibold mt-3 mb-2",
  5: "text-sm font-semibold mt-3 mb-2",
  6: "text-sm font-medium mt-2 mb-1",
};

const TokenRenderer = memo(function TokenRenderer({ token }: { token: Token }) {
  switch (token.type) {
    case "paragraph":
      return (
        <p className="my-3 leading-7">
          <Inline text={token.content} />
        </p>
      );

    case "heading":
      const Tag = `h${token.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return (
        <Tag className={HEADING_CLASSES[token.level]}>
          <Inline text={token.content} />
        </Tag>
      );

    case "code":
      return <CodeBlock code={token.content} lang={token.lang} />;

    case "list":
      const ListTag = token.ordered ? "ol" : "ul";
      return (
        <ListTag className={`my-3 ml-6 space-y-1 ${token.ordered ? "list-decimal" : "list-disc"}`}>
          {token.items.map((item, i) => (
            <li key={i} className="pl-1">
              <Inline text={item} />
            </li>
          ))}
        </ListTag>
      );

    case "blockquote":
      return (
        <blockquote className="my-4 pl-4 border-l-4 border-border text-foreground-muted italic">
          <Inline text={token.content} />
        </blockquote>
      );

    case "hr":
      return <hr className="my-6 border-border" />;

    case "table":
      return (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-background-secondary/50">
                {token.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2 text-left font-semibold">
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {token.rows.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-background-hover/30">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2">
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
});

interface Props {
  content: string;
}

export const Markdown = memo(function Markdown({ content }: Props) {
  const tokens = useMemo(() => parse(content), [content]);

  return (
    <div className="markdown-body">
      {tokens.map((token, i) => (
        <TokenRenderer key={i} token={token} />
      ))}
    </div>
  );
});
