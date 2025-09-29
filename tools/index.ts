import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Core note operations
import { registerCreateNote } from "./core/create-note.ts";
import { registerGetNote } from "./core/get-note.ts";
import { registerGetNoteContent } from "./core/get-note-content.ts";
import { registerUpdateNote } from "./core/update-note.ts";
import { registerDeleteNote } from "./core/delete-note.ts";
import { registerMoveNote } from "./core/move-note.ts";

// Search operations
import { registerSearchNotes } from "./search/search-notes.ts";

// Calendar operations (unified)
import { registerGetCalendarNote } from "./calendar/get-calendar-note.ts";

// File operations
import { registerCreateAttachment } from "./files/create-attachment.ts";

// System operations
import { registerGetAppInfo } from "./system/get-app-info.ts";
import { registerExportNote } from "./system/export-note.ts";
import { registerCreateBackup } from "./system/create-backup.ts";

// Helper function to register all tools for a server instance
export function registerTools(server: McpServer) {
  // Register core note operations
  registerCreateNote(server);
  registerGetNote(server);
  registerGetNoteContent(server);
  registerUpdateNote(server);
  registerDeleteNote(server);
  registerMoveNote(server);

  // Register search operations
  registerSearchNotes(server);

  // Register unified calendar operations
  registerGetCalendarNote(server);

  // Register file operations
  registerCreateAttachment(server);

  // Register system operations
  registerGetAppInfo(server);
  registerExportNote(server);
  registerCreateBackup(server);
}