// Inline markdown - iterative parsing for performance
// Uses non-backtracking patterns to avoid catastrophic regex performance

import { memo } from "react";

interface Segment {
  type: "text" | "bold" | "italic" | "code" | "link" | "strike" | "image";
  content: string;
  href?: string;
}

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  let remaining = text;
  let iterations = 0;
  const maxIterations = text.length * 2; // Safety limit

  while (remaining.length > 0 && iterations++ < maxIterations) {
    // Inline code first (highest priority, unambiguous)
    let match = remaining.match(/^`([^`]+)`/);
    if (match) {
      segments.push({ type: "code", content: match[1] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold: **text** (no nested asterisks allowed)
    match = remaining.match(/^\*\*([^*]+)\*\*/);
    if (match) {
      segments.push({ type: "bold", content: match[1] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold: __text__ (no nested underscores)
    match = remaining.match(/^__([^_]+)__/);
    if (match) {
      segments.push({ type: "bold", content: match[1] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Strikethrough: ~~text~~
    match = remaining.match(/^~~([^~]+)~~/);
    if (match) {
      segments.push({ type: "strike", content: match[1] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic: *text* (single char between, no spaces around asterisks for safety)
    match = remaining.match(/^\*([^*\s][^*]*[^*\s]|[^*\s])\*/);
    if (match) {
      segments.push({ type: "italic", content: match[1] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic: _text_
    match = remaining.match(/^_([^_\s][^_]*[^_\s]|[^_\s])_/);
    if (match) {
      segments.push({ type: "italic", content: match[1] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Image: ![alt](url)
    match = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      segments.push({ type: "image", content: match[1], href: match[2] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Link: [text](url)
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      segments.push({ type: "link", content: match[1], href: match[2] });
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Plain text: consume one char at a time for safety, or until next potential marker
    const nextSpecial = remaining.slice(1).search(/[*_`~\[!]/);
    if (nextSpecial === -1) {
      segments.push({ type: "text", content: remaining });
      break;
    } else {
      segments.push({ type: "text", content: remaining.slice(0, nextSpecial + 1) });
      remaining = remaining.slice(nextSpecial + 1);
    }
  }

  // If we hit the iteration limit, just return remaining as text
  if (remaining.length > 0) {
    segments.push({ type: "text", content: remaining });
  }

  return segments;
}

interface Props {
  text: string;
}

export const Inline = memo(function Inline({ text }: Props) {
  const segments = parseInline(text);

  return (
    <>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "bold":
            return <strong key={i} className="font-semibold">{seg.content}</strong>;
          case "italic":
            return <em key={i} className="italic">{seg.content}</em>;
          case "strike":
            return <del key={i} className="line-through opacity-70">{seg.content}</del>;
          case "code":
            return (
              <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-background-secondary text-accent font-mono text-[0.9em]">
                {seg.content}
              </code>
            );
          case "link":
            return (
              <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {seg.content}
              </a>
            );
          case "image":
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={seg.href} alt={seg.content} className="inline-block max-h-64 rounded" />
            );
          default:
            return <span key={i}>{seg.content}</span>;
        }
      })}
    </>
  );
});
