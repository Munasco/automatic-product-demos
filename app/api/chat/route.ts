import { createOpenAI } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 60;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages, model = "gpt-4o" }: { messages: UIMessage[]; model?: string } = await req.json();

  // Check if model supports reasoning (thinking models)
  const isThinkingModel = model.includes("thinking") || model.includes("o1") || model.includes("o3");

  const result = streamText({
    model: openai(model),
    system: `You are ${model} a helpful AI assistant. You help users with:
- Answering questions
- Writing and reviewing code
- Explaining concepts
- Creative tasks
- Problem solving

Be helpful, harmless, and honest. Use markdown formatting when appropriate.`,
    messages: convertToModelMessages(messages),
  });

  // Enable reasoning traces for thinking models
  return result.toUIMessageStreamResponse({
    sendReasoning: isThinkingModel,
  });
}
