import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerUpdateNote(server: McpServer) {
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
      try {
        const res = await etapi(`/notes/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, content }),
        });
        return formatSuccess("Note updated successfully", res);
      } catch (error) {
        return formatError("update_note", error);
      }
    }
  );
}