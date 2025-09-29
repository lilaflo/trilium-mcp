import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerUpdateNote(server: McpServer) {
  server.registerTool(
    "update_note",
    {
      description: "Update note title and/or content by id",
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
        contentOnly: z
          .boolean()
          .default(false)
          .describe("If true, only update content using direct content API (for large content updates)"),
      },
    },
    async ({ id, title, content, contentOnly }) => {
      try {
        // If contentOnly is true or we only have content (no title), use the direct content API
        if (contentOnly || (content !== undefined && title === undefined)) {
          if (!content) {
            throw new Error("Content is required when using contentOnly mode");
          }

          await etapi(`/notes/${id}/content`, {
            method: "PUT",
            headers: {
              "Content-Type": "text/plain",
            },
            body: content,
          });

          return formatSuccess("Note content updated successfully", { id, contentUpdated: true });
        }

        // Otherwise use the PATCH API which can handle both title and content
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;

        if (Object.keys(updateData).length === 0) {
          throw new Error("At least title or content must be provided");
        }

        const res = await etapi(`/notes/${id}`, {
          method: "PATCH",
          body: JSON.stringify(updateData),
        });

        return formatSuccess("Note updated successfully", res);
      } catch (error) {
        return formatError("update_note", error);
      }
    }
  );
}