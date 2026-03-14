/**
 * HTTP SSE transport for agent-launch MCP server.
 *
 * Usage: npx agent-launch-mcp --serve [port]
 *
 * Integration with index.ts main():
 *   if (process.argv.includes('--serve')) {
 *     const { startHttpServer } = await import('./serve.js');
 *     const portIdx = process.argv.indexOf('--serve');
 *     const port = parseInt(process.argv[portIdx + 1]) || 3100;
 *     await startHttpServer(server, port);
 *   }
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import http from "node:http";

export async function startHttpServer(
  mcpServer: Server,
  port = 3100,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let SSEServerTransport: any;
  try {
    const mod = await import("@modelcontextprotocol/sdk/server/sse.js");
    SSEServerTransport = mod.SSEServerTransport;
  } catch {
    console.error(
      "SSEServerTransport not available. Install @modelcontextprotocol/sdk >= 1.0 for HTTP support.",
    );
    console.error("Falling back to stdio transport.");
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    await mcpServer.connect(new StdioServerTransport());
    return;
  }

  const transports = new Map<
    string,
    InstanceType<typeof SSEServerTransport>
  >();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // SSE endpoint — clients connect here for streaming
    if (url.pathname === "/sse" && req.method === "GET") {
      const transport = new SSEServerTransport("/message", res);
      transports.set(transport.sessionId, transport);
      res.on("close", () => transports.delete(transport.sessionId));
      await mcpServer.connect(transport);
      return;
    }

    // Message endpoint — clients POST tool calls here
    if (url.pathname === "/message" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId");
      const transport = sessionId ? transports.get(sessionId) : undefined;
      if (!transport) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
        return;
      }
      const body: Buffer[] = [];
      req.on("data", (chunk: Buffer) => body.push(chunk));
      req.on("end", async () => {
        await transport.handlePostMessage(
          req,
          res,
          Buffer.concat(body).toString(),
        );
      });
      return;
    }

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: "agent-launch-mcp",
          version: "2.0.0",
          transport: "sse",
          sessions: transports.size,
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  httpServer.listen(port, () => {
    console.error(
      `Agent-Launch MCP server (HTTP SSE) on http://localhost:${port}`,
    );
    console.error(`  SSE: http://localhost:${port}/sse`);
    console.error(`  Health: http://localhost:${port}/health`);
  });
}
