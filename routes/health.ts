import type { FastifyInstance } from "fastify";

export default async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint for fly.io
  fastify.get("/health", async (request, reply) => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "trilium-mcp",
      version: "0.1.0",
    };
  });
}