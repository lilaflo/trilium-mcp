// mcp-trilium-server.ts
import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import healthRoutes from "./routes/health.ts";
import mcpRoutes from "./routes/mcp.ts";

// Global connection tracking
let activeConnections = 0;
let totalConnections = 0;
let lastActivityTime = Date.now();

// Memory and health monitoring
function logSystemHealth() {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  console.log(`[${new Date().toISOString()}] [HEALTH] System Status:`);
  console.log(`[${new Date().toISOString()}] [HEALTH] - Uptime: ${Math.floor(uptime)}s`);
  console.log(`[${new Date().toISOString()}] [HEALTH] - Active connections: ${activeConnections}`);
  console.log(`[${new Date().toISOString()}] [HEALTH] - Total connections: ${totalConnections}`);
  console.log(`[${new Date().toISOString()}] [HEALTH] - Last activity: ${Math.floor((Date.now() - lastActivityTime) / 1000)}s ago`);
  console.log(`[${new Date().toISOString()}] [HEALTH] - Memory usage:`, {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
  });
}

// Log system health every 30 seconds
setInterval(logSystemHealth, 30000);

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
  logger: {
    level: 'info'
  },
  requestTimeout: 60000, // 60 second timeout
  bodyLimit: 10485760, // 10MB limit
});

// Track connections
fastify.addHook('onRequest', async (request, reply) => {
  activeConnections++;
  totalConnections++;
  lastActivityTime = Date.now();
  console.log(`[${new Date().toISOString()}] [CONN] New connection: ${request.method} ${request.url} (Active: ${activeConnections}, Total: ${totalConnections})`);
});

fastify.addHook('onResponse', async (request, reply) => {
  activeConnections--;
  console.log(`[${new Date().toISOString()}] [CONN] Connection closed: ${request.method} ${request.url} ${reply.statusCode} (Active: ${activeConnections})`);
});

fastify.addHook('onTimeout', async (request, reply) => {
  console.error(`[${new Date().toISOString()}] [TIMEOUT] Request timeout: ${request.method} ${request.url}`);
});

fastify.addHook('onError', async (request, reply, error) => {
  console.error(`[${new Date().toISOString()}] [ERROR] Request error: ${request.method} ${request.url}`, error);
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
    console.log(`[${new Date().toISOString()}] [STARTUP] MCP Trilium Server running on http://${HOST}:${PORT}`);
    console.log(`[${new Date().toISOString()}] [STARTUP] Connect using: http://${HOST}:${PORT}/mcp`);
    console.log(`[${new Date().toISOString()}] [STARTUP] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[${new Date().toISOString()}] [STARTUP] ETAPI_BASE: ${ETAPI_BASE}`);
    console.log(`[${new Date().toISOString()}] [STARTUP] AUTH token present: ${AUTH ? "yes" : "no"}`);
    console.log(`[${new Date().toISOString()}] [STARTUP] AUTH token length: ${AUTH ? AUTH.length : 0}`);
    console.log(`[${new Date().toISOString()}] [STARTUP] Request timeout: 60s`);
    console.log(`[${new Date().toISOString()}] [STARTUP] Body limit: 10MB`);

    // Log initial system health
    logSystemHealth();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [STARTUP] Failed to start server:`, err);
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log(`[${new Date().toISOString()}] [SHUTDOWN] SIGTERM received, shutting down gracefully`);
  logSystemHealth();
  await fastify.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log(`[${new Date().toISOString()}] [SHUTDOWN] SIGINT received, shutting down gracefully`);
  logSystemHealth();
  await fastify.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] [FATAL] Uncaught exception:`, err);
  logSystemHealth();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] [FATAL] Unhandled rejection at:`, promise, 'reason:', reason);
  logSystemHealth();
  process.exit(1);
});

// Initialize and start the server
initializeServer().catch((err) => {
  console.error(`[${new Date().toISOString()}] [STARTUP] Failed to start server:`, err);
  process.exit(1);
});
