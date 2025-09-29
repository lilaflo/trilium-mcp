import type { FastifyInstance } from "fastify";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "../tools/trilium-tools.ts";
import packageJson from "../package.json" with { type: "json" };

export default async function mcpRoutes(fastify: FastifyInstance) {
  // Handle POST requests for client-to-server communication (stateless)
  fastify.post("/mcp", async (request, reply) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] [${requestId}] MCP POST request received`);
    console.log(`[${new Date().toISOString()}] [${requestId}] Request headers:`, JSON.stringify(request.headers, null, 2));
    console.log(`[${new Date().toISOString()}] [${requestId}] Request body:`, JSON.stringify(request.body, null, 2));

    try {
      // Create new instances for each request to ensure isolation
      console.log(`[${new Date().toISOString()}] [${requestId}] Creating new MCP server instance`);
      const sessionServer = new McpServer({
        name: packageJson.name,
        version: packageJson.version,
      });
      console.log(`[${new Date().toISOString()}] [${requestId}] MCP server created successfully`);

      // Register all tools for this request
      console.log(`[${new Date().toISOString()}] [${requestId}] Registering tools`);
      registerTools(sessionServer);
      console.log(`[${new Date().toISOString()}] [${requestId}] Tools registered successfully`);

      console.log(`[${new Date().toISOString()}] [${requestId}] Creating transport`);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
        enableDnsRebindingProtection: false,
      });
      console.log(`[${new Date().toISOString()}] [${requestId}] Transport created successfully`);

      reply.raw.on("close", () => {
        const endTime = Date.now();
        console.log(`[${new Date().toISOString()}] [${requestId}] Connection closed after ${endTime - startTime}ms`);
        try {
          console.log(`[${new Date().toISOString()}] [${requestId}] Closing transport and server`);
          transport.close();
          sessionServer.close();
          console.log(`[${new Date().toISOString()}] [${requestId}] Transport and server closed successfully`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [${requestId}] Error closing transport/server:`, error);
        }
      });

      console.log(`[${new Date().toISOString()}] [${requestId}] Connecting server to transport`);
      await sessionServer.connect(transport);
      console.log(`[${new Date().toISOString()}] [${requestId}] Server connected, handling request`);

      await transport.handleRequest(request.raw, reply.raw, request.body);

      const endTime = Date.now();
      console.log(`[${new Date().toISOString()}] [${requestId}] Request handled successfully in ${endTime - startTime}ms`);
    } catch (error) {
      const endTime = Date.now();
      console.error(`[${new Date().toISOString()}] [${requestId}] Error handling MCP request after ${endTime - startTime}ms:`, error);
      console.error(`[${new Date().toISOString()}] [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

      if (!reply.sent) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log(`[${new Date().toISOString()}] [${requestId}] Sending error response`);
        reply.code(500).send({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: `Internal server error: ${errorMessage}`,
          },
          id: null,
        });
      } else {
        console.log(`[${new Date().toISOString()}] [${requestId}] Reply already sent, cannot send error response`);
      }
    }
  });

  // SSE notifications not supported in stateless mode
  fastify.get("/mcp", async (request, reply) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    console.log(`[${new Date().toISOString()}] [${requestId}] Received GET MCP request`);
    console.log(`[${new Date().toISOString()}] [${requestId}] Request headers:`, JSON.stringify(request.headers, null, 2));
    reply.code(405).send({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed in stateless mode.",
      },
      id: null,
    });
  });

  // Session termination not needed in stateless mode
  fastify.delete("/mcp", async (request, reply) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    console.log(`[${new Date().toISOString()}] [${requestId}] Received DELETE MCP request`);
    console.log(`[${new Date().toISOString()}] [${requestId}] Request headers:`, JSON.stringify(request.headers, null, 2));
    reply.code(405).send({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed in stateless mode.",
      },
      id: null,
    });
  });
}