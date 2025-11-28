"use client";

import { Markdown } from "../../lib/markdown";

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  return <Markdown content={content} />;
}
