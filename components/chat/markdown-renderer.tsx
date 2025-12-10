"use client";

import { Markdown } from "../../lib/markdown";

interface Props {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming }: Props) {
  return <Markdown content={content} isStreaming={isStreaming} />;
}
