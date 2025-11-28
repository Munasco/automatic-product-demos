// Token types - discriminated union for type safety

export type Token =
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; content: string }
  | { type: "code"; lang: string; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blockquote"; content: string }
  | { type: "hr" }
  | { type: "table"; headers: string[]; rows: string[][] };
