import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerGetInboxNote(server: McpServer) {
  server.registerTool(
    "get_inbox_note",
    {
      description: "Get the inbox note for a specific date",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15)"),
      },
    },
    async ({ date }) => {
      try {
        const note = await etapi(`/inbox/${date}`, {
          method: "GET",
        });
        return formatSuccess("Inbox note retrieved successfully", note);
      } catch (error) {
        return formatError("get_inbox_note", error);
      }
    }
  );
}