import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerGetCalendarNote(server: McpServer) {
  server.registerTool(
    "get_calendar_note",
    {
      description: "Get or create calendar notes (day, week, month, or inbox) for specific dates",
      inputSchema: {
        date: z.string().describe("Date in YYYY-MM-DD format (e.g., 2025-01-15) or month in YYYY-MM format for monthly notes"),
        type: z
          .enum(["day", "week", "month", "inbox"])
          .default("day")
          .describe("Type of calendar note: 'day' for daily notes, 'week' for weekly, 'month' for monthly, 'inbox' for inbox notes"),
      },
    },
    async ({ date, type }) => {
      try {
        let apiPath: string;

        switch (type) {
          case "day":
            apiPath = `/calendar/days/${date}`;
            break;
          case "week":
            apiPath = `/calendar/weeks/${date}`;
            break;
          case "month":
            // For month notes, expect YYYY-MM format
            if (!date.match(/^\d{4}-\d{2}$/)) {
              throw new Error("Month type requires date in YYYY-MM format (e.g., 2025-01)");
            }
            apiPath = `/calendar/months/${date}`;
            break;
          case "inbox":
            apiPath = `/inbox/${date}`;
            break;
          default:
            throw new Error(`Invalid calendar type: ${type}`);
        }

        const note = await etapi(apiPath, {
          method: "GET",
        });

        return formatSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} note retrieved successfully`, {
          type,
          date,
          note
        });
      } catch (error) {
        return formatError("get_calendar_note", error);
      }
    }
  );
}