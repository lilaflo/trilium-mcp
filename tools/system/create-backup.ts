import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.js";

export function registerCreateBackup(server: McpServer) {
  server.registerTool(
    "create_backup",
    {
      description: "Create a database backup with a given name",
      inputSchema: {
        backupName: z.string().describe("Name for the backup (will create backup-{name}.db)"),
      },
    },
    async ({ backupName }) => {
      try {
        await etapi(`/backup/${backupName}`, {
          method: "PUT",
        });
        return formatSuccess(`Backup created: backup-${backupName}.db`, {
          backupName: backupName
        });
      } catch (error) {
        return formatError("create_backup", error);
      }
    }
  );
}