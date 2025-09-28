// mcp-trilium-server.ts
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { z } from "zod";

// Ensure ETAPI_BASE always has the /etapi path
const ETAPI_BASE = process.env.TRILIUM_URL;
const AUTH = process.env.TRILIUM_TOKEN; // ETAPI token

if (!AUTH || !ETAPI_BASE) {
  console.error(
    "TRILIUM_TOKEN and TRILIUM_URL environment variables are required"
  );
  process.exit(1);
}

interface ETAPIOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

async function etapi(path: string, init: ETAPIOptions = {}): Promise<any> {
  const headers = {
    ...init.headers,
    Authorization: `Basic ${Buffer.from(`etapi:${AUTH}`).toString("base64")}`,
    "Content-Type": "application/json",
  };

  const url = `${ETAPI_BASE}${path}`;
  console.log(`ETAPI request: ${init.method || "GET"} ${url}`);

  try {
    const res = await fetch(url, {
      ...init,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`ETAPI error: ${res.status} ${errorText}`);
      throw new Error(`ETAPI request failed: ${res.status} ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`ETAPI request failed: ${error.message}`);
      throw error;
    }
    throw new Error("Unknown error occurred during ETAPI request");
  }
}

// Helper function to register all tools for a server instance
function registerTools(server: McpServer) {
  server.registerTool(
    "create_note",
    {
      description:
        "Create a note under parentId with title and optional content",
      inputSchema: {
        parentId: z
          .string()
          .describe("ID of the parent note to create the new note under"),
        title: z.string().describe("Title of the new note"),
        content: z
          .string()
          .optional()
          .describe("Content of the new note (optional)"),
        type: z
          .string()
          .default("text")
          .describe("Type of note (default: text)"),
      },
    },
    async ({ parentId, title, content, type }) => {
      const note = await etapi("/create-note", {
        method: "POST",
        body: JSON.stringify({
          parentNoteId: parentId,
          title: title,
          type: type || "text",
          content: content || "",
        }),
      });
      return { content: [{ type: "text", text: JSON.stringify(note) }] };
    }
  );

  server.registerTool(
    "find_notes",
    {
      description: "Search notes by fulltext query",
      inputSchema: {
        q: z.string().describe("Search query to find notes"),
      },
    },
    async ({ q }) => {
      const res = await etapi(`/search?query=${encodeURIComponent(q)}`);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  server.registerTool(
    "search_note",
    {
      description:
        "Advanced search for notes with multiple criteria including title, content, labels, and attributes",
      inputSchema: {
        query: z.string().describe("Main search query text"),
        searchIn: z
          .enum(["title", "content", "both"])
          .default("both")
          .describe("Where to search: title only, content only, or both"),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(20)
          .describe("Maximum number of results to return (1-100, default: 20)"),
        includeArchived: z
          .boolean()
          .default(false)
          .describe("Whether to include archived notes in search results"),
        noteType: z
          .string()
          .optional()
          .describe("Filter by note type (e.g., 'text', 'code', 'book', etc.)"),
      },
    },
    async ({ query, searchIn, limit, includeArchived, noteType }) => {
      try {
        let searchQuery = query;

        // Build advanced search query based on parameters
        if (searchIn === "title") {
          searchQuery = `note.title *=* "${query}"`;
        } else if (searchIn === "content") {
          searchQuery = `note.content *=* "${query}"`;
        }

        if (noteType) {
          searchQuery += ` note.type = ${noteType}`;
        }

        if (!includeArchived) {
          searchQuery += ` !note.isArchived`;
        }

        const searchParams = new URLSearchParams({
          query: searchQuery,
          limit: limit.toString(),
        });

        const res = await etapi(`/search?${searchParams.toString()}`);

        // Format the response with better structure
        const formattedResult = {
          query: searchQuery,
          totalResults: res.length || 0,
          results: res.map((note: any) => ({
            noteId: note.noteId,
            title: note.title,
            type: note.type,
            isArchived: note.isArchived,
            dateCreated: note.dateCreated,
            dateModified: note.dateModified,
            // Include a snippet of content if available
            contentPreview: note.content
              ? note.content.substring(0, 200) + "..."
              : null,
          })),
        };

        return {
          content: [
            { type: "text", text: JSON.stringify(formattedResult, null, 2) },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Search failed",
                  message: errorMessage,
                  query: query,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "update_note",
    {
      description: "Update note title/content by id",
      inputSchema: {
        id: z.string().describe("ID of the note to update"),
        title: z
          .string()
          .optional()
          .describe("New title for the note (optional)"),
        content: z
          .string()
          .optional()
          .describe("New content for the note (optional)"),
      },
    },
    async ({ id, title, content }) => {
      const res = await etapi(`/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, content }),
      });
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );
}

// Express app setup
const app = express();
app.use(express.json());

// Health check endpoint for fly.io
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "trilium-mcp",
    version: "0.1.0",
  });
});

// CORS configuration for browser-based clients
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "mcp-session-id"],
  })
);

// Handle POST requests for client-to-server communication (stateless)
app.post("/mcp", async (req, res) => {
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

    res.on("close", () => {
      try {
        transport.close();
        sessionServer.close();
      } catch (error) {
        console.error("Error closing transport/server:", error);
      }
    });

    await sessionServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
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
app.get("/mcp", (req, res) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed in stateless mode.",
      },
      id: null,
    })
  );
});

// Session termination not needed in stateless mode
app.delete("/mcp", (req, res) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed in stateless mode.",
      },
      id: null,
    })
  );
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`MCP Trilium Server running on http://${HOST}:${PORT}`);
  console.log(`Connect using: http://${HOST}:${PORT}/mcp`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`ETAPI_BASE: ${ETAPI_BASE}`);
  console.log(`AUTH token present: ${AUTH ? "yes" : "no"}`);
  console.log(`AUTH token length: ${AUTH ? AUTH.length : 0}`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
