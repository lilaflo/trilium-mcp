import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerDeleteNote(server: McpServer) {
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
        return formatSuccess(`Note ${noteId} deleted successfully`);
      } catch (error) {
        return formatError("delete_note", error);
      }
    }
  );
}