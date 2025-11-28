// Single-pass markdown parser - handles all common markdown patterns

import type { Token } from "./types";

export function parse(input: string): Token[] {
  const tokens: Token[] = [];
  const lines = input.split("\n");
  let i = 0;

  const consumeWhile = (pred: (line: string) => boolean): string[] => {
    const result: string[] = [];
    while (i < lines.length && pred(lines[i])) {
      result.push(lines[i]);
      i++;
    }
    return result;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line - skip
    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block: ```lang
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      tokens.push({ type: "code", lang: lang || "text", content: codeLines.join("\n") });
      continue;
    }

    // Heading: # to ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      tokens.push({ type: "heading", level, content: headingMatch[2] });
      i++;
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // Table: | header | header |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines = consumeWhile((l) => l.trim().startsWith("|") && l.trim().endsWith("|"));
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row.split("|").slice(1, -1).map((cell) => cell.trim());
        const headers = parseRow(tableLines[0]);
        // Skip separator row (|---|---|)
        const dataStart = tableLines[1].includes("-") ? 2 : 1;
        const rows = tableLines.slice(dataStart).map(parseRow);
        tokens.push({ type: "table", headers, rows });
      }
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith(">")) {
      const quoteLines = consumeWhile((l) => l.trim().startsWith(">"));
      const content = quoteLines.map((l) => l.replace(/^>\s?/, "")).join("\n");
      tokens.push({ type: "blockquote", content });
      continue;
    }

    // Unordered list: - item, * item, + item
    if (/^[-*+]\s/.test(trimmed)) {
      const items = consumeWhile((l) => /^[-*+]\s/.test(l.trim()) || /^\s+/.test(l))
        .map((l) => l.replace(/^[-*+]\s/, "").trim());
      tokens.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list: 1. item
    if (/^\d+\.\s/.test(trimmed)) {
      const items = consumeWhile((l) => /^\d+\.\s/.test(l.trim()) || /^\s+/.test(l))
        .map((l) => l.replace(/^\d+\.\s/, "").trim());
      tokens.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (
        !t ||
        t.startsWith("```") ||
        t.startsWith("#") ||
        t.startsWith(">") ||
        t.startsWith("|") ||
        /^[-*+]\s/.test(t) ||
        /^\d+\.\s/.test(t) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(t)
      ) {
        break;
      }
      paraLines.push(t);
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({ type: "paragraph", content: paraLines.join(" ") });
    }
  }

  return tokens;
}
