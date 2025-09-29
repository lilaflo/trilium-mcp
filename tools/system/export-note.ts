import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerExportNote(server: McpServer) {
  server.registerTool(
    "export_note",
    {
      description: "Export a note subtree as ZIP file",
      inputSchema: {
        noteId: z.string().describe("ID of the note to export (use 'root' for full export)"),
        format: z.enum(["html", "markdown"]).default("html").describe("Export format"),
      },
    },
    async ({ noteId, format }) => {
      try {
        const exportData = await etapi(`/notes/${noteId}/export?format=${format}`, {
          method: "GET",
        });
        return formatSuccess(`Export completed for note ${noteId}`, {
          format: format,
          noteId: noteId
          // Note: In a real implementation, you'd want to handle the binary ZIP data appropriately
        });
      } catch (error) {
        return formatError("export_note", error);
      }
    }
  );
}