import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerGetDayNote(server: McpServer) {
  server.registerTool(
    "get_day_note",
    {
      description: "Get or create a day note for a specific date",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15)"),
      },
    },
    async ({ date }) => {
      try {
        const note = await etapi(`/calendar/days/${date}`, {
          method: "GET",
        });
        return formatSuccess("Day note retrieved successfully", note);
      } catch (error) {
        return formatError("get_day_note", error);
      }
    }
  );
}