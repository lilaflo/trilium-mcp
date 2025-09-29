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
      const note = await etapi("/notes", {
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
}
