import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.ts";

export function registerCreateNote(server: McpServer) {
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
      try {
        const note = await etapi("/create-note", {
          method: "POST",
          body: JSON.stringify({
            parentNoteId: parentId,
            title: title,
            type: type || "text",
            content: content || "",
          }),
        });
        return formatSuccess("Note created successfully", note);
      } catch (error) {
        return formatError("create_note", error);
      }
    }
  );
}