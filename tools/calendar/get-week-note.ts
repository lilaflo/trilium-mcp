import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerGetWeekNote(server: McpServer) {
  server.registerTool(
    "get_week_note",
    {
      description: "Get or create a week note for a specific date",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15)"),
      },
    },
    async ({ date }) => {
      try {
        const note = await etapi(`/calendar/weeks/${date}`, {
          method: "GET",
        });
        return formatSuccess("Week note retrieved successfully", note);
      } catch (error) {
        return formatError("get_week_note", error);
      }
    }
  );
}