import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.ts";

export function registerCreateAttachment(server: McpServer) {
  server.registerTool(
    "create_attachment",
    {
      description: "Create an attachment for a note",
      inputSchema: {
        ownerId: z.string().describe("ID of the note that will own this attachment"),
        title: z.string().describe("Title/filename of the attachment"),
        role: z.string().default("file").describe("Role of the attachment (default: file)"),
        mime: z.string().default("text/plain").describe("MIME type of the attachment"),
        content: z.string().describe("Content of the attachment (base64 for binary files)"),
        position: z.number().optional().describe("Position of the attachment"),
      },
    },
    async ({ ownerId, title, role, mime, content, position }) => {
      try {
        const attachment = await etapi("/attachments", {
          method: "POST",
          body: JSON.stringify({
            ownerId,
            title,
            role,
            mime,
            content,
            position,
          }),
        });
        return formatSuccess("Attachment created successfully", attachment);
      } catch (error) {
        return formatError("create_attachment", error);
      }
    }
  );
}