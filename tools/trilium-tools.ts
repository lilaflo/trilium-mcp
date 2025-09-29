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
      const res = await etapi(`/notes?search=${encodeURIComponent(q)}`);
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

        // For advanced search, use the simple search endpoint with query parameter
        const res = await etapi(`/notes?search=${encodeURIComponent(searchQuery)}`);

        // Format the response with better structure
        const formattedResult = {
          query: searchQuery,
          totalResults: res.results ? res.results.length : 0,
          results: res.results ? res.results.slice(0, limit).map((note: any) => ({
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
          })) : [],
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