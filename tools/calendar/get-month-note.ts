import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerGetMonthNote(server: McpServer) {
  server.registerTool(
    "get_month_note",
    {
      description: "Get or create a month note for a specific month",
      inputSchema: {
        month: z.string().describe("Month in YYYY-MM format (e.g., 2025-01)"),
      },
    },
    async ({ month }) => {
      try {
        const note = await etapi(`/calendar/months/${month}`, {
          method: "GET",
        });
        return formatSuccess("Month note retrieved successfully", note);
      } catch (error) {
        return formatError("get_month_note", error);
      }
    }
  );
}