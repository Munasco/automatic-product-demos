import WebSocket from "ws";
import http from "http";

const DEBUGGER_PORT = process.argv[2] || "9230";

async function getDebuggerUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${DEBUGGER_PORT}/json`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const info = JSON.parse(data)[0];
        resolve(info.webSocketDebuggerUrl);
      });
    }).on("error", reject);
  });
}

async function main() {
  const wsUrl = await getDebuggerUrl();
  console.log("🔗 Connecting to:", wsUrl);

  const ws = new WebSocket(wsUrl);
  let msgId = 1;

  ws.on("open", () => {
    console.log("✅ Connected to Node.js debugger\n");

    // Enable Runtime domain
    ws.send(JSON.stringify({ id: msgId++, method: "Runtime.enable" }));

    // Check NODE_ENV
    ws.send(
      JSON.stringify({
        id: msgId++,
        method: "Runtime.evaluate",
        params: { expression: "process.env.NODE_ENV" },
      })
    );

    // Check memory usage
    ws.send(JSON.stringify({ id: msgId++, method: "Runtime.getHeapUsage" }));

    // Check process uptime
    ws.send(
      JSON.stringify({
        id: msgId++,
        method: "Runtime.evaluate",
        params: { expression: "process.uptime()" },
      })
    );

    // Check OPENAI_KEY exists
    ws.send(
      JSON.stringify({
        id: msgId++,
        method: "Runtime.evaluate",
        params: { expression: "!!process.env.OPENAI_KEY || !!process.env.OPENAI_API_KEY" },
      })
    );

    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 2000);
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.id) {
      case 2:
        console.log("📌 NODE_ENV:", msg.result?.result?.value || "undefined");
        break;
      case 3:
        const heapMB = Math.round(msg.result?.usedSize / 1024 / 1024);
        const totalMB = Math.round(msg.result?.totalSize / 1024 / 1024);
        console.log(`💾 Heap: ${heapMB}MB / ${totalMB}MB`);
        break;
      case 4:
        console.log("⏱️  Uptime:", Math.round(msg.result?.result?.value), "seconds");
        break;
      case 5:
        console.log("🔑 OpenAI Key:", msg.result?.result?.value ? "✓ Set" : "✗ Missing");
        break;
    }
  });

  ws.on("error", (e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  });
}

main().catch(console.error);
