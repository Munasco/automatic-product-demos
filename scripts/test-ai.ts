import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY,
});

async function testAI() {
  const model = "gpt-4o-mini";

  console.log("🚀 Starting AI test...");
  console.log(`📦 Model: ${model}`);
  console.log(`🔑 API Key: ${process.env.OPENAI_KEY || process.env.OPENAI_API_KEY ? "Present" : "MISSING!"}`);
  console.log("---");

  const startTime = Date.now();
  let firstChunkTime: number | null = null;
  let chunkCount = 0;

  try {
    const result = streamText({
      model: openai(model),
      system: "You are a helpful AI assistant. Be concise.",
      messages: [
        { role: "user", content: "Say hello and count to 5" }
      ],
    });

    console.log("⏳ Waiting for first chunk...\n");

    for await (const chunk of result.textStream) {
      if (firstChunkTime === null) {
        firstChunkTime = Date.now();
        console.log(`\n⚡ Time to first chunk: ${firstChunkTime - startTime}ms\n`);
        console.log("--- Response ---");
      }
      chunkCount++;
      process.stdout.write(chunk);
    }

    const endTime = Date.now();

    console.log("\n--- End Response ---\n");
    console.log(`✅ Stream complete!`);
    console.log(`📊 Stats:`);
    console.log(`   - Total time: ${endTime - startTime}ms`);
    console.log(`   - Time to first chunk: ${firstChunkTime ? firstChunkTime - startTime : "N/A"}ms`);
    console.log(`   - Streaming time: ${firstChunkTime ? endTime - firstChunkTime : "N/A"}ms`);
    console.log(`   - Chunk count: ${chunkCount}`);

  } catch (error) {
    const errorTime = Date.now();
    console.error("\n❌ Error occurred!");
    console.error(`   - Time to error: ${errorTime - startTime}ms`);
    console.error(`   - Error:`, error);
  }
}

testAI();
