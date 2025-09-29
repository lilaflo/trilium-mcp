import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Core note operations
import { registerCreateNote } from "./core/create-note.js";
import { registerGetNote } from "./core/get-note.js";
import { registerGetNoteContent } from "./core/get-note-content.js";
import { registerUpdateNote } from "./core/update-note.js";
import { registerUpdateNoteContent } from "./core/update-note-content.js";
import { registerDeleteNote } from "./core/delete-note.js";

// Search operations
import { registerSearchNotes } from "./search/search-notes.js";

// Calendar operations
import { registerGetDayNote } from "./calendar/get-day-note.js";
import { registerGetWeekNote } from "./calendar/get-week-note.js";
import { registerGetMonthNote } from "./calendar/get-month-note.js";
import { registerGetInboxNote } from "./calendar/get-inbox-note.js";

// File operations
import { registerCreateAttachment } from "./files/create-attachment.js";

// System operations
import { registerGetAppInfo } from "./system/get-app-info.js";
import { registerExportNote } from "./system/export-note.js";
import { registerCreateBackup } from "./system/create-backup.js";

// Helper function to register all tools for a server instance
export function registerTools(server: McpServer) {
  // Register core note operations
  registerCreateNote(server);
  registerGetNote(server);
  registerGetNoteContent(server);
  registerUpdateNote(server);
  registerUpdateNoteContent(server);
  registerDeleteNote(server);

  // Register search operations
  registerSearchNotes(server);

  // Register calendar operations
  registerGetDayNote(server);
  registerGetWeekNote(server);
  registerGetMonthNote(server);
  registerGetInboxNote(server);

  // Register file operations
  registerCreateAttachment(server);

  // Register system operations
  registerGetAppInfo(server);
  registerExportNote(server);
  registerCreateBackup(server);
}