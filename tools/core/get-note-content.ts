import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.ts";

export function registerGetNoteContent(server: McpServer) {
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
        return formatSuccess("Note content retrieved successfully", { noteId, content });
      } catch (error) {
        return formatError("get_note_content", error);
      }
    }
  );
}