import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the anthropic module
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => ({
    doGenerate: vi.fn(),
    doStream: vi.fn(),
  })),
}));

// Mock streamText
vi.mock("ai", () => ({
  streamText: vi.fn(() => ({
    toTextStreamResponse: vi.fn(() => new Response("mocked stream")),
  })),
}));

describe("Chat API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle POST request with messages", async () => {
    const { POST } = await import("../../app/api/chat/route");

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello, Claude!" }],
      }),
    });

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(Response);
  });

  it("should call streamText with correct parameters", async () => {
    const { streamText } = await import("ai");
    const { POST } = await import("../../app/api/chat/route");

    const testMessages = [
      { role: "user", content: "What is TypeScript?" },
    ];

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: testMessages }),
    });

    await POST(mockRequest);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: testMessages,
        system: expect.stringContaining("Claude Code"),
      })
    );
  });

  it("should handle empty messages array", async () => {
    const { POST } = await import("../../app/api/chat/route");

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [] }),
    });

    const response = await POST(mockRequest);
    expect(response).toBeInstanceOf(Response);
  });

  it("should handle multi-turn conversation", async () => {
    const { streamText } = await import("ai");
    const { POST } = await import("../../app/api/chat/route");

    const testMessages = [
      { role: "user", content: "Write a function" },
      { role: "assistant", content: "Here's a function..." },
      { role: "user", content: "Add error handling" },
    ];

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: testMessages }),
    });

    await POST(mockRequest);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: testMessages,
      })
    );
  });
});
