import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { etapi, formatSuccess, formatError } from "../etapi.ts";

export function registerMoveNote(server: McpServer) {
  server.registerTool(
    "move_note",
    {
      description: "Move a note to a different parent in the note tree",
      inputSchema: {
        noteId: z.string().describe("ID of the note to move"),
        parentId: z.string().describe("ID of the new parent note"),
        position: z.number().optional().describe("Position under the new parent (optional)"),
      },
    },
    async ({ noteId, parentId, position }) => {
      try {
        // First, get the current branch information for the note
        const currentBranches = await etapi(`/notes/${noteId}/branches`, {
          method: "GET",
        });

        if (!currentBranches || currentBranches.length === 0) {
          return formatError("move_note", new Error("Note has no branches"));
        }

        // Create new branch under the target parent
        const newBranch = await etapi("/branches", {
          method: "POST",
          body: JSON.stringify({
            noteId,
            parentId,
            position,
          }),
        });

        // If the note had only one branch (typical case), delete the old branch
        // If it had multiple branches (cloned note), keep the others
        if (currentBranches.length === 1) {
          const oldBranchId = currentBranches[0].branchId;
          await etapi(`/branches/${oldBranchId}`, {
            method: "DELETE",
          });
        }

        return formatSuccess("Note moved successfully", {
          noteId,
          newParentId: parentId,
          branchId: newBranch.branchId,
          position: newBranch.position,
        });
      } catch (error) {
        return formatError("move_note", error);
      }
    }
  );
}