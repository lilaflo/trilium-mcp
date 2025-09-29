import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { etapi, formatSuccess, formatError } from "../etapi.ts";

export function registerGetAppInfo(server: McpServer) {
  server.registerTool(
    "get_app_info",
    {
      description: "Get information about the running Trilium instance",
      inputSchema: {},
    },
    async () => {
      try {
        const info = await etapi("/app-info", {
          method: "GET",
        });
        return formatSuccess("App info retrieved successfully", info);
      } catch (error) {
        return formatError("get_app_info", error);
      }
    }
  );
}