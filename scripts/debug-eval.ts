#!/usr/bin/env npx tsx
import WebSocket from "ws";
import http from "http";
import readline from "readline";

const DEBUGGER_PORT = process.argv[2] || "9230";

async function getDebuggerUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${DEBUGGER_PORT}/json`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const info = JSON.parse(data)[0];
          resolve(info.webSocketDebuggerUrl);
        });
      })
      .on("error", reject);
  });
}

async function evaluate(ws: WebSocket, expr: string): Promise<unknown> {
  return new Promise((resolve) => {
    const id = Date.now();
    const handler = (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off("message", handler);
        if (msg.result?.exceptionDetails) {
          resolve({ error: msg.result.exceptionDetails.text });
        } else {
          resolve(msg.result?.result?.value ?? msg.result?.result);
        }
      }
    };
    ws.on("message", handler);
    ws.send(
      JSON.stringify({
        id,
        method: "Runtime.evaluate",
        params: {
          expression: expr,
          returnByValue: true,
        },
      })
    );
  });
}

async function main() {
  const wsUrl = await getDebuggerUrl();
  console.log("🔗 Connected to debugger");
  console.log('Type JavaScript expressions to evaluate. Type "exit" to quit.\n');

  const ws = new WebSocket(wsUrl);

  await new Promise<void>((resolve) => ws.on("open", resolve));
  ws.send(JSON.stringify({ id: 0, method: "Runtime.enable" }));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("debug> ", async (input) => {
      const expr = input.trim();
      if (expr === "exit" || expr === "quit") {
        ws.close();
        rl.close();
        process.exit(0);
      }
      if (!expr) {
        prompt();
        return;
      }

      try {
        const result = await evaluate(ws, expr);
        console.log("=>", JSON.stringify(result, null, 2));
      } catch (e) {
        console.error("Error:", e);
      }
      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
