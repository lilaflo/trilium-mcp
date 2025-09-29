import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerUpdateNoteContent(server: McpServer) {
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
        return formatSuccess(`Content updated for note ${noteId}`);
      } catch (error) {
        return formatError("update_note_content", error);
      }
    }
  );
}