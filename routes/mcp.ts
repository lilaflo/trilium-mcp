import type { FastifyInstance } from "fastify";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "../tools/trilium-tools.ts";

export default async function mcpRoutes(fastify: FastifyInstance) {
  // Handle POST requests for client-to-server communication (stateless)
  fastify.post("/mcp", async (request, reply) => {
    try {
      // Create new instances for each request to ensure isolation
      const sessionServer = new McpServer({
        name: "trilium-mcp",
        version: "0.1.0",
      });

      // Register all tools for this request
      registerTools(sessionServer);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
        enableDnsRebindingProtection: false,
      });

      reply.raw.on("close", () => {
        try {
          transport.close();
          sessionServer.close();
        } catch (error) {
          console.error("Error closing transport/server:", error);
        }
      });

      await sessionServer.connect(transport);
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!reply.sent) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        reply.code(500).send({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: `Internal server error: ${errorMessage}`,
          },
          id: null,
        });
      }
    }
  });

  // SSE notifications not supported in stateless mode
  fastify.get("/mcp", async (request, reply) => {
    console.log("Received GET MCP request");
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
    console.log("Received DELETE MCP request");
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