import type { FastifyInstance } from "fastify";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "../tools/index.js";
import { formatError } from "../tools/etapi.js";
import packageJson from "../package.json" with { type: "json" };

interface SessionTransport {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

const sessions = new Map<string, SessionTransport>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export default async function mcpRoutes(fastify: FastifyInstance) {
  fastify.post("/mcp", async (request, reply) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();
    const sessionId = request.headers["mcp-session-id"] as string | undefined;

    console.debug(`[${new Date().toISOString()}] [${requestId}] MCP POST request received, session: ${sessionId || 'new'}`);

    try {
      let transport: StreamableHTTPServerTransport;
      let sessionServer: McpServer;

      if (sessionId && sessions.has(sessionId)) {
        const existing = sessions.get(sessionId)!;
        transport = existing.transport;
        sessionServer = existing.server;
        console.debug(`[${new Date().toISOString()}] [${requestId}] Reusing existing session`);
      } else {
        sessionServer = new McpServer({
          name: packageJson.name,
          version: packageJson.version,
        });
        registerTools(sessionServer);

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => generateSessionId(),
          enableDnsRebindingProtection: true,
        });

        let newSessionId: string | undefined;

        reply.raw.on("close", () => {
          const endTime = Date.now();
          console.debug(`[${new Date().toISOString()}] [${requestId}] Connection closed after ${endTime - startTime}ms`);
          if (newSessionId && sessions.has(newSessionId)) {
            const session = sessions.get(newSessionId)!;
            try {
              session.transport.close();
              session.server.close();
            } catch (e) {
              console.error(`[${new Date().toISOString()}] [${requestId}] Error closing transport on disconnect:`, e);
            }
            sessions.delete(newSessionId);
            console.debug(`[${new Date().toISOString()}] [${requestId}] Session ${newSessionId} cleaned up`);
          }
        });

        await sessionServer.connect(transport);

        newSessionId = transport.sessionId;
        if (newSessionId) {
          sessions.set(newSessionId, { transport, server: sessionServer });
          reply.header("Mcp-Session-Id", newSessionId);
          console.debug(`[${new Date().toISOString()}] [${requestId}] Created new session: ${newSessionId}`);
        }
      }

      await transport.handleRequest(request.raw, reply.raw, request.body);

      const endTime = Date.now();
      console.debug(`[${new Date().toISOString()}] [${requestId}] Request handled in ${endTime - startTime}ms`);
    } catch (error) {
      const endTime = Date.now();
      console.error(`[${new Date().toISOString()}] [${requestId}] Error after ${endTime - startTime}ms:`, error);

      if (!reply.sent) {
        const errorResponse = formatError("MCP request processing", error);
        reply.code(500).send(errorResponse);
      }
    }
  });

  fastify.get("/mcp", async (request, reply) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    console.debug(`[${new Date().toISOString()}] [${requestId}] GET /mcp - SSE not supported, returning 405`);
    
    reply.code(405);
    reply.header("Allow", "POST");
    reply.send("Method Not Allowed. Use POST for MCP requests.");
  });

  fastify.delete("/mcp", async (request, reply) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const sessionId = request.headers["mcp-session-id"] as string | undefined;
    
    console.debug(`[${new Date().toISOString()}] [${requestId}] DELETE /mcp, session: ${sessionId}`);

    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      try {
        session.transport.close();
        session.server.close();
      } catch (e) {
        console.error(`[${new Date().toISOString()}] [${requestId}] Error closing session:`, e);
      }
      sessions.delete(sessionId);
      console.debug(`[${new Date().toISOString()}] [${requestId}] Session ${sessionId} terminated`);
    }

    reply.code(200).send({
      jsonrpc: "2.0",
      result: { message: "Session terminated" },
      id: null,
    });
  });
}