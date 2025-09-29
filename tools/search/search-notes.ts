import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.ts";

export function registerSearchNotes(server: McpServer) {
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
          return formatSuccess("Search completed successfully", res);
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

        return formatSuccess("Search completed successfully", formattedResult);
      } catch (error) {
        return formatError("search_notes", error);
      }
    }
  );
}