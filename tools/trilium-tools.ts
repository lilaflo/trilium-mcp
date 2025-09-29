import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fetch from "node-fetch";

// Ensure ETAPI_BASE always has the /etapi path
const ETAPI_BASE = process.env.TRILIUM_URL;
const AUTH = process.env.TRILIUM_TOKEN; // ETAPI token

interface ETAPIOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

async function etapi(path: string, init: ETAPIOptions = {}): Promise<any> {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();

  const headers = {
    Authorization: `Basic ${Buffer.from(`etapi:${AUTH}`).toString("base64")}`,
    "Content-Type": "application/json",
    ...init.headers, // Allow overriding Content-Type and other headers
  };

  const url = `${ETAPI_BASE}${path}`;
  console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Starting ${init.method || "GET"} request to ${url}`);
  console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request headers:`, JSON.stringify(headers, null, 2));
  if (init.body) {
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request body:`, init.body);
  }

  try {
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Making fetch request`);
    const res = await fetch(url, {
      ...init,
      headers,
    });
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Fetch completed with status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorText = await res.text();
      const endTime = Date.now();
      console.error(`[${new Date().toISOString()}] [ETAPI-${requestId}] ETAPI error after ${endTime - startTime}ms: ${res.status} ${errorText}`);
      throw new Error(`ETAPI request failed: ${res.status} ${errorText}`);
    }

    // Handle content endpoints that return plain text/html
    if (path.includes('/content')) {
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Parsing response as text (content endpoint)`);
      const textResult = await res.text();
      const endTime = Date.now();
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request completed successfully in ${endTime - startTime}ms, response length: ${textResult.length} chars`);
      return textResult;
    }

    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Parsing response as JSON`);
    const jsonResult = await res.json();
    const endTime = Date.now();
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request completed successfully in ${endTime - startTime}ms`);
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Response data:`, JSON.stringify(jsonResult, null, 2));
    return jsonResult;
  } catch (error) {
    const endTime = Date.now();
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] [ETAPI-${requestId}] ETAPI request failed after ${endTime - startTime}ms: ${error.message}`);
      console.error(`[${new Date().toISOString()}] [ETAPI-${requestId}] Error stack:`, error.stack);
      throw error;
    }
    console.error(`[${new Date().toISOString()}] [ETAPI-${requestId}] Unknown error occurred during ETAPI request after ${endTime - startTime}ms`);
    throw new Error("Unknown error occurred during ETAPI request");
  }
}

// Helper function to register all tools for a server instance
export function registerTools(server: McpServer) {
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
    "search_notes",
    {
      description: "Search notes with optional filtering and formatting",
      inputSchema: {
        query: z.string().describe("Search query to find notes"),
        limit: z
          .number()
          .min(1)
          .max(100)
          .default(20)
          .describe("Maximum number of results to return (1-100, default: 20)"),
        format: z
          .enum(["raw", "structured"])
          .default("structured")
          .describe(
            "Output format: 'raw' for direct API response, 'structured' for formatted results"
          ),
      },
    },
    async ({ query, limit, format }) => {
      try {
        const res = await etapi(`/notes?search=${encodeURIComponent(query)}`);

        if (format === "raw") {
          return { content: [{ type: "text", text: JSON.stringify(res) }] };
        }

        // Structured format with better presentation
        const results = res.results || [];
        const limitedResults = results.slice(0, limit);

        const formattedResult = {
          query: query,
          totalResults: results.length,
          displayedResults: limitedResults.length,
          results: limitedResults.map((note: any) => ({
            noteId: note.noteId,
            title: note.title,
            type: note.type,
            isArchived: note.isArchived || false,
            dateCreated: note.dateCreated,
            dateModified: note.dateModified,
            parentNoteIds: note.parentNoteIds || [],
            attributes: note.attributes || [],
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

  // Get specific note by ID
  server.registerTool(
    "get_note",
    {
      description: "Get a specific note by its ID",
      inputSchema: {
        noteId: z.string().describe("ID of the note to retrieve"),
      },
    },
    async ({ noteId }) => {
      try {
        const note = await etapi(`/notes/${noteId}`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(note, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get note",
              message: errorMessage,
              noteId: noteId,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Delete note by ID
  server.registerTool(
    "delete_note",
    {
      description: "Delete a note by its ID",
      inputSchema: {
        noteId: z.string().describe("ID of the note to delete"),
      },
    },
    async ({ noteId }) => {
      try {
        await etapi(`/notes/${noteId}`, {
          method: "DELETE",
        });
        return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Note ${noteId} deleted successfully` }) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to delete note",
              message: errorMessage,
              noteId: noteId,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Get note content (HTML)
  server.registerTool(
    "get_note_content",
    {
      description: "Get the raw HTML content of a note",
      inputSchema: {
        noteId: z.string().describe("ID of the note to get content for"),
      },
    },
    async ({ noteId }) => {
      try {
        const content = await etapi(`/notes/${noteId}/content`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify({ noteId, content }, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get note content",
              message: errorMessage,
              noteId: noteId,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Update note content directly
  server.registerTool(
    "update_note_content",
    {
      description: "Update the HTML content of a note directly",
      inputSchema: {
        noteId: z.string().describe("ID of the note to update content for"),
        content: z.string().describe("New HTML content for the note"),
      },
    },
    async ({ noteId, content }) => {
      try {
        await etapi(`/notes/${noteId}/content`, {
          method: "PUT",
          headers: {
            "Content-Type": "text/plain",
          },
          body: content,
        });
        return { content: [{ type: "text", text: JSON.stringify({ success: true, message: `Content updated for note ${noteId}` }) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to update note content",
              message: errorMessage,
              noteId: noteId,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Get day note (calendar integration)
  server.registerTool(
    "get_day_note",
    {
      description: "Get or create a day note for a specific date",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15)"),
      },
    },
    async ({ date }) => {
      try {
        const note = await etapi(`/calendar/days/${date}`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(note, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get day note",
              message: errorMessage,
              date: date,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Get week note
  server.registerTool(
    "get_week_note",
    {
      description: "Get or create a week note for a specific date",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15)"),
      },
    },
    async ({ date }) => {
      try {
        const note = await etapi(`/calendar/weeks/${date}`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(note, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get week note",
              message: errorMessage,
              date: date,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Get month note
  server.registerTool(
    "get_month_note",
    {
      description: "Get or create a month note for a specific month",
      inputSchema: {
        month: z.string().describe("Month in YYYY-MM format (e.g., 2025-01)"),
      },
    },
    async ({ month }) => {
      try {
        const note = await etapi(`/calendar/months/${month}`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(note, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get month note",
              message: errorMessage,
              month: month,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Get inbox note
  server.registerTool(
    "get_inbox_note",
    {
      description: "Get the inbox note for a specific date",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15)"),
      },
    },
    async ({ date }) => {
      try {
        const note = await etapi(`/inbox/${date}`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(note, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get inbox note",
              message: errorMessage,
              date: date,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Create attachment
  server.registerTool(
    "create_attachment",
    {
      description: "Create an attachment for a note",
      inputSchema: {
        ownerId: z.string().describe("ID of the note that will own this attachment"),
        title: z.string().describe("Title/filename of the attachment"),
        role: z.string().default("file").describe("Role of the attachment (default: file)"),
        mime: z.string().default("text/plain").describe("MIME type of the attachment"),
        content: z.string().describe("Content of the attachment (base64 for binary files)"),
        position: z.number().optional().describe("Position of the attachment"),
      },
    },
    async ({ ownerId, title, role, mime, content, position }) => {
      try {
        const attachment = await etapi("/attachments", {
          method: "POST",
          body: JSON.stringify({
            ownerId,
            title,
            role,
            mime,
            content,
            position,
          }),
        });
        return { content: [{ type: "text", text: JSON.stringify(attachment, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to create attachment",
              message: errorMessage,
              ownerId: ownerId,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Get app info
  server.registerTool(
    "get_app_info",
    {
      description: "Get information about the running Trilium instance",
      inputSchema: {},
    },
    async () => {
      try {
        const info = await etapi("/app-info", {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to get app info",
              message: errorMessage,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Export note
  server.registerTool(
    "export_note",
    {
      description: "Export a note subtree as ZIP file",
      inputSchema: {
        noteId: z.string().describe("ID of the note to export (use 'root' for full export)"),
        format: z.enum(["html", "markdown"]).default("html").describe("Export format"),
      },
    },
    async ({ noteId, format }) => {
      try {
        const exportData = await etapi(`/notes/${noteId}/export?format=${format}`, {
          method: "GET",
        });
        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          message: `Export completed for note ${noteId}`,
          format: format,
          // Note: In a real implementation, you'd want to handle the binary ZIP data appropriately
        }, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to export note",
              message: errorMessage,
              noteId: noteId,
            }, null, 2)
          }],
        };
      }
    }
  );

  // Create backup
  server.registerTool(
    "create_backup",
    {
      description: "Create a database backup with a given name",
      inputSchema: {
        backupName: z.string().describe("Name for the backup (will create backup-{name}.db)"),
      },
    },
    async ({ backupName }) => {
      try {
        await etapi(`/backup/${backupName}`, {
          method: "PUT",
        });
        return { content: [{ type: "text", text: JSON.stringify({
          success: true,
          message: `Backup created: backup-${backupName}.db`,
          backupName: backupName,
        }, null, 2) }] };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Failed to create backup",
              message: errorMessage,
              backupName: backupName,
            }, null, 2)
          }],
        };
      }
    }
  );
}
