import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { components } from "./_generated/api";
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const http = httpRouter();

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

// Stream chat messages using AI SDK
export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as {
    streamId: string;
    model: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const generateChat = async (
    ctx: any,
    request: Request,
    streamId: StreamId,
    chunkAppender: (chunk: string) => Promise<void>
  ) => {
    const isThinkingModel =
      body.model.includes("thinking") ||
      body.model.includes("o1") ||
      body.model.includes("o3");

    const result = streamText({
      model: openai(body.model),
      system: `You are ${body.model} a helpful AI assistant. You help users with:
- Answering questions
- Writing and reviewing code
- Explaining concepts
- Creative tasks
- Problem solving

Be helpful, harmless, and honest. Use markdown formatting when appropriate.`,
      messages: body.messages,
    });

    // Stream the text to the persistent storage
    for await (const chunk of result.textStream) {
      await chunkAppender(chunk);
    }
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    generateChat
  );

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});

http.route({
  path: "/stream-chat",
  method: "POST",
  handler: streamChat,
});

export default http;
