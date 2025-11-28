import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { message }: { message: string } = await req.json();

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "Generate a very short title (3-6 words) for this chat based on the user's message. No quotes, no punctuation at the end.",
    prompt: message,
  });

  return Response.json({ title: text.trim() });
}
