// mcp-trilium-server.ts
import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import healthRoutes from "./routes/health.ts";
import mcpRoutes from "./routes/mcp.ts";

// Environment validation
const ETAPI_BASE = process.env.TRILIUM_URL;
const AUTH = process.env.TRILIUM_TOKEN;

if (!AUTH || !ETAPI_BASE) {
  console.error(
    "TRILIUM_TOKEN and TRILIUM_URL environment variables are required"
  );
  process.exit(1);
}

// Fastify app setup
const fastify = Fastify({
  logger: true,
});

// Initialize server
async function initializeServer() {
  // Register CORS plugin
  await fastify.register(fastifyCors, {
    origin: "*",
    exposedHeaders: ["Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "mcp-session-id"],
  });

  // Register route modules
  await fastify.register(healthRoutes);
  await fastify.register(mcpRoutes);

  // Start HTTP server
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = "0.0.0.0";

  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`MCP Trilium Server running on http://${HOST}:${PORT}`);
    console.log(`Connect using: http://${HOST}:${PORT}/mcp`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`ETAPI_BASE: ${ETAPI_BASE}`);
    console.log(`AUTH token present: ${AUTH ? "yes" : "no"}`);
    console.log(`AUTH token length: ${AUTH ? AUTH.length : 0}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await fastify.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await fastify.close();
  process.exit(0);
});

// Initialize and start the server
initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
