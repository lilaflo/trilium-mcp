import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerGetNote(server: McpServer) {
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
        return formatSuccess("Note retrieved successfully", note);
      } catch (error) {
        return formatError("get_note", error);
      }
    }
  );
}