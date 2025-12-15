import type { FastifyInstance } from "fastify";

// Package info - update when version changes
const packageJson = {
  name: "trilium-mcp-server",
  version: "1.0.0",
  description: "MCP server for Trilium Notes integration",
  license: "MIT",
};

interface ToolParameter {
  type: string;
  description: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  format?: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, ToolParameter>;
  returns: {
    type: string;
    description: string;
  };
  examples: {
    description: string;
    request: any;
    response: any;
  }[];
  notes?: string[];
}

const tools: ToolDefinition[] = [
  {
    name: "create_note",
    description: "Create a new note under a parent note with title and optional content",
    category: "Note Management",
    parameters: {
      parentId: {
        type: "string",
        description: "ID of the parent note (use 'root' for top-level notes)",
        required: true,
      },
      title: {
        type: "string",
        description: "Title of the new note",
        required: true,
      },
      content: {
        type: "string",
        description: "HTML content of the note",
        required: false,
        default: "",
      },
      type: {
        type: "string",
        description: "Type of note",
        required: false,
        default: "text",
      },
    },
    returns: {
      type: "object",
      description: "Created note object with noteId, title, type, and metadata",
    },
    examples: [
      {
        description: "Create a simple text note",
        request: {
          parentId: "root",
          title: "My New Note",
          content: "<h1>Hello World</h1><p>This is my first note.</p>",
          type: "text",
        },
        response: {
          noteId: "abc123",
          title: "My New Note",
          type: "text",
          dateCreated: "2025-01-15 10:30:00",
          dateModified: "2025-01-15 10:30:00",
        },
      },
    ],
  },
  {
    name: "get_note",
    description: "Retrieve a specific note by its ID",
    category: "Note Management",
    parameters: {
      noteId: {
        type: "string",
        description: "ID of the note to retrieve",
        required: true,
      },
    },
    returns: {
      type: "object",
      description: "Note object with complete metadata, attributes, and relationships",
    },
    examples: [
      {
        description: "Get note details",
        request: {
          noteId: "abc123",
        },
        response: {
          noteId: "abc123",
          title: "My Note",
          type: "text",
          isProtected: false,
          isArchived: false,
          dateCreated: "2025-01-15 10:30:00",
          dateModified: "2025-01-15 10:30:00",
          parentNoteIds: ["root"],
        },
      },
    ],
  },
  {
    name: "get_note_content",
    description: "Get the raw HTML content of a note",
    category: "Note Management",
    parameters: {
      noteId: {
        type: "string",
        description: "ID of the note to get content for",
        required: true,
      },
    },
    returns: {
      type: "string",
      description: "Raw HTML content of the note",
    },
    examples: [
      {
        description: "Retrieve note content",
        request: {
          noteId: "abc123",
        },
        response: {
          noteId: "abc123",
          content: "<h1>Hello World</h1><p>This is my first note.</p>",
        },
      },
    ],
  },
  {
    name: "update_note",
    description: "Update note title and/or content by ID",
    category: "Note Management",
    parameters: {
      id: {
        type: "string",
        description: "ID of the note to update",
        required: true,
      },
      title: {
        type: "string",
        description: "New title for the note",
        required: false,
      },
      content: {
        type: "string",
        description: "New content for the note",
        required: false,
      },
    },
    returns: {
      type: "object",
      description: "Updated note object",
    },
    examples: [
      {
        description: "Update note title",
        request: {
          id: "abc123",
          title: "Updated Title",
        },
        response: {
          noteId: "abc123",
          title: "Updated Title",
          dateModified: "2025-01-15 11:00:00",
        },
      },
    ],
  },
  {
    name: "update_note_content",
    description: "Update the HTML content of a note directly",
    category: "Note Management",
    parameters: {
      noteId: {
        type: "string",
        description: "ID of the note to update",
        required: true,
      },
      content: {
        type: "string",
        description: "New HTML content for the note",
        required: true,
      },
    },
    returns: {
      type: "object",
      description: "Success confirmation",
    },
    examples: [
      {
        description: "Update note content",
        request: {
          noteId: "abc123",
          content: "<h1>Updated Content</h1><p>This has been updated.</p>",
        },
        response: {
          success: true,
          message: "Content updated for note abc123",
        },
      },
    ],
  },
  {
    name: "delete_note",
    description: "Delete a note by its ID",
    category: "Note Management",
    parameters: {
      noteId: {
        type: "string",
        description: "ID of the note to delete",
        required: true,
      },
    },
    returns: {
      type: "object",
      description: "Success confirmation",
    },
    examples: [
      {
        description: "Delete a note",
        request: {
          noteId: "abc123",
        },
        response: {
          success: true,
          message: "Note abc123 deleted successfully",
        },
      },
    ],
  },
  {
    name: "search_notes",
    description: "Search notes with query string, optional filtering and formatting",
    category: "Search",
    parameters: {
      query: {
        type: "string",
        description: "Search query to find notes",
        required: true,
      },
      limit: {
        type: "number",
        description: "Maximum number of results to return",
        required: false,
        default: 20,
        minimum: 1,
        maximum: 100,
      },
      format: {
        type: "string",
        description: "Output format",
        required: false,
        default: "structured",
        enum: ["raw", "structured"],
      },
    },
    returns: {
      type: "object",
      description: "Search results with note metadata",
    },
    examples: [
      {
        description: "Search for notes containing 'project'",
        request: {
          query: "project",
          limit: 10,
          format: "structured",
        },
        response: {
          query: "project",
          totalResults: 5,
          displayedResults: 5,
          results: [
            {
              noteId: "abc123",
              title: "Project Ideas",
              type: "text",
              isArchived: false,
              dateCreated: "2025-01-15 10:30:00",
              dateModified: "2025-01-15 10:30:00",
            },
          ],
        },
      },
    ],
  },
  {
    name: "get_day_note",
    description: "Get or create a calendar day note for a specific date",
    category: "Calendar",
    parameters: {
      date: {
        type: "string",
        description: "Date in YYYY-MM-DD format",
        required: true,
        format: "date",
      },
    },
    returns: {
      type: "object",
      description: "Day note object",
    },
    examples: [
      {
        description: "Get today's note",
        request: {
          date: "2025-01-15",
        },
        response: {
          noteId: "day_20250115",
          title: "2025-01-15",
          type: "text",
          dateCreated: "2025-01-15 00:00:00",
        },
      },
    ],
  },
  {
    name: "get_week_note",
    description: "Get or create a calendar week note for a specific date",
    category: "Calendar",
    parameters: {
      date: {
        type: "string",
        description: "Date in YYYY-MM-DD format",
        required: true,
        format: "date",
      },
    },
    returns: {
      type: "object",
      description: "Week note object",
    },
    examples: [
      {
        description: "Get week note",
        request: {
          date: "2025-01-15",
        },
        response: {
          noteId: "week_202503",
          title: "Week 03/2025",
          type: "text",
        },
      },
    ],
    notes: [
      "⚠️ Known issue: May require ISO week format (YYYY-Wnn) instead of YYYY-MM-DD",
    ],
  },
  {
    name: "get_month_note",
    description: "Get or create a calendar month note for a specific month",
    category: "Calendar",
    parameters: {
      month: {
        type: "string",
        description: "Month in YYYY-MM format",
        required: true,
        format: "month",
      },
    },
    returns: {
      type: "object",
      description: "Month note object",
    },
    examples: [
      {
        description: "Get January 2025 note",
        request: {
          month: "2025-01",
        },
        response: {
          noteId: "month_202501",
          title: "January 2025",
          type: "text",
        },
      },
    ],
  },
  {
    name: "get_inbox_note",
    description: "Get the inbox note for a specific date",
    category: "Calendar",
    parameters: {
      date: {
        type: "string",
        description: "Date in YYYY-MM-DD format",
        required: true,
        format: "date",
      },
    },
    returns: {
      type: "object",
      description: "Inbox note object (typically same as day note)",
    },
    examples: [
      {
        description: "Get inbox for today",
        request: {
          date: "2025-01-15",
        },
        response: {
          noteId: "inbox_20250115",
          title: "Inbox 2025-01-15",
          type: "text",
        },
      },
    ],
  },
  {
    name: "create_attachment",
    description: "Create a file attachment for a note",
    category: "Attachments",
    parameters: {
      ownerId: {
        type: "string",
        description: "ID of the note that will own this attachment",
        required: true,
      },
      title: {
        type: "string",
        description: "Filename of the attachment",
        required: true,
      },
      role: {
        type: "string",
        description: "Role of the attachment",
        required: false,
        default: "file",
      },
      mime: {
        type: "string",
        description: "MIME type of the attachment",
        required: false,
        default: "text/plain",
      },
      content: {
        type: "string",
        description: "Content of the attachment (base64 encoded for binary files)",
        required: true,
      },
      position: {
        type: "number",
        description: "Position of the attachment",
        required: false,
      },
    },
    returns: {
      type: "object",
      description: "Created attachment object",
    },
    examples: [
      {
        description: "Attach a text file",
        request: {
          ownerId: "abc123",
          title: "document.txt",
          role: "file",
          mime: "text/plain",
          content: "VGhpcyBpcyBhIHRlc3QgZmlsZQ==",
        },
        response: {
          attachmentId: "att_xyz789",
          title: "document.txt",
          mime: "text/plain",
          ownerId: "abc123",
        },
      },
    ],
  },
  {
    name: "get_app_info",
    description: "Get information about the running Trilium instance",
    category: "System",
    parameters: {},
    returns: {
      type: "object",
      description: "System information including version, build, and configuration",
    },
    examples: [
      {
        description: "Get system info",
        request: {},
        response: {
          appVersion: "0.98.0",
          dbVersion: "233",
          nodeVersion: "v22.18.0",
          syncVersion: "28",
          buildDate: "2025-01-10",
          dataDirectory: "/data/trilium",
        },
      },
    ],
  },
  {
    name: "export_note",
    description: "Export a note subtree as a ZIP file",
    category: "System",
    parameters: {
      noteId: {
        type: "string",
        description: "ID of the note to export (use 'root' for full export)",
        required: true,
      },
      format: {
        type: "string",
        description: "Export format",
        required: false,
        default: "html",
        enum: ["html", "markdown"],
      },
    },
    returns: {
      type: "binary",
      description: "ZIP file containing the exported notes",
    },
    examples: [
      {
        description: "Export note as HTML",
        request: {
          noteId: "abc123",
          format: "html",
        },
        response: {
          success: true,
          message: "Export completed for note abc123",
          format: "html",
        },
      },
    ],
    notes: [
      "⚠️ Known issue: Returns binary ZIP data but JSON handling may need improvement",
    ],
  },
  {
    name: "create_backup",
    description: "Create a database backup with a given name",
    category: "System",
    parameters: {
      backupName: {
        type: "string",
        description: "Name for the backup (will create backup-{name}.db)",
        required: true,
      },
    },
    returns: {
      type: "object",
      description: "Success confirmation",
    },
    examples: [
      {
        description: "Create a backup",
        request: {
          backupName: "manual-backup-2025-01-15",
        },
        response: {
          success: true,
          message: "Backup created: backup-manual-backup-2025-01-15.db",
          backupName: "manual-backup-2025-01-15",
        },
      },
    ],
    notes: [
      "⚠️ Known issue: Returns empty response (204 No Content), requires special handling",
    ],
  },
];

export default async function docsRoutes(fastify: FastifyInstance) {
  // MCP Manifest endpoint - static JSON representation of tools/list
  fastify.get("/mcp.json", async (request, reply) => {
    reply.type("application/json").send({
      jsonrpc: "2.0",
      result: {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: "object",
            properties: Object.fromEntries(
              Object.entries(tool.parameters).map(([name, param]) => [
                name,
                {
                  type: param.type,
                  description: param.description,
                  ...(param.enum && { enum: param.enum }),
                  ...(param.default !== undefined && { default: param.default }),
                  ...(param.minimum !== undefined && { minimum: param.minimum }),
                  ...(param.maximum !== undefined && { maximum: param.maximum }),
                  ...(param.format && { format: param.format }),
                },
              ])
            ),
            required: Object.entries(tool.parameters)
              .filter(([, param]) => param.required)
              .map(([name]) => name),
            additionalProperties: false,
            $schema: "http://json-schema.org/draft-07/schema#",
          },
        })),
      },
    });
  });

  // Main documentation endpoint
  fastify.get("/docs", async (request, reply) => {
    const categories = Array.from(
      new Set(tools.map((tool) => tool.category))
    ).sort();

    const toolsByCategory: Record<string, ToolDefinition[]> = {};
    categories.forEach((cat) => {
      toolsByCategory[cat] = tools.filter((t) => t.category === cat);
    });

    reply.type("text/html").send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${packageJson.name} - API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        header h1 { font-size: 2.5em; margin-bottom: 10px; }
        header p { font-size: 1.2em; opacity: 0.95; }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .info-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-card h3 { font-size: 0.9em; color: #666; margin-bottom: 5px; }
        .info-card p { font-size: 1.3em; color: #667eea; font-weight: bold; }
        nav {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        nav h2 { margin-bottom: 15px; color: #667eea; }
        nav ul { list-style: none; }
        nav ul li { margin: 8px 0; }
        nav a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            padding: 5px 10px;
            display: inline-block;
            border-radius: 4px;
            transition: background 0.3s;
        }
        nav a:hover { background: #f0f0f0; }
        .category {
            background: white;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .category h2 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        .tool {
            margin-bottom: 40px;
            padding-bottom: 40px;
            border-bottom: 1px solid #eee;
        }
        .tool:last-child { border-bottom: none; }
        .tool h3 {
            color: #333;
            font-size: 1.5em;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .tool-name {
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 6px;
            font-family: "Courier New", monospace;
            font-size: 0.9em;
        }
        .description {
            color: #666;
            margin-bottom: 20px;
            font-size: 1.05em;
        }
        .section {
            margin: 20px 0;
        }
        .section h4 {
            color: #555;
            margin-bottom: 12px;
            font-size: 1.1em;
        }
        .params-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            background: #fafafa;
            border-radius: 6px;
            overflow: hidden;
        }
        .params-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .params-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .params-table tr:last-child td { border-bottom: none; }
        .required { color: #e74c3c; font-weight: bold; }
        .optional { color: #27ae60; font-weight: bold; }
        .param-name {
            font-family: "Courier New", monospace;
            color: #667eea;
            font-weight: bold;
        }
        .param-type {
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: "Courier New", monospace;
            font-size: 0.9em;
        }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 10px 0;
            font-size: 0.9em;
        }
        .example {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            margin: 15px 0;
        }
        .example h5 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .notes {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .notes ul {
            margin-left: 20px;
        }
        footer {
            text-align: center;
            padding: 30px;
            color: #666;
            margin-top: 50px;
        }
        .json-endpoint {
            margin-top: 20px;
            padding: 15px;
            background: #e8f4f8;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .json-endpoint a {
            color: #667eea;
            text-decoration: none;
            font-family: "Courier New", monospace;
            font-weight: bold;
        }
        .json-endpoint a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${packageJson.name}</h1>
            <p>${packageJson.description}</p>
            <div class="info-grid">
                <div class="info-card">
                    <h3>Version</h3>
                    <p>${packageJson.version}</p>
                </div>
                <div class="info-card">
                    <h3>Total Endpoints</h3>
                    <p>${tools.length}</p>
                </div>
                <div class="info-card">
                    <h3>Categories</h3>
                    <p>${categories.length}</p>
                </div>
                <div class="info-card">
                    <h3>Protocol</h3>
                    <p>MCP 1.0</p>
                </div>
            </div>
        </header>

        <div class="json-endpoint">
            <strong>📋 Need machine-readable format?</strong> Get JSON documentation at:
            <a href="/docs/json">/docs/json</a>
        </div>

        <nav>
            <h2>📑 Categories</h2>
            <ul>
                ${categories.map((cat) => `<li><a href="#${cat.toLowerCase().replace(/\s+/g, "-")}">${cat}</a></li>`).join("")}
            </ul>
        </nav>

        ${categories
          .map(
            (cat) => `
            <div class="category" id="${cat.toLowerCase().replace(/\s+/g, "-")}">
                <h2>${cat}</h2>
                ${toolsByCategory[cat]
                  .map(
                    (tool) => `
                    <div class="tool">
                        <h3>
                            <span class="tool-name">${tool.name}</span>
                        </h3>
                        <p class="description">${tool.description}</p>

                        ${
                          Object.keys(tool.parameters).length > 0
                            ? `
                        <div class="section">
                            <h4>Parameters</h4>
                            <table class="params-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Required</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(tool.parameters)
                                      .map(
                                        ([name, param]) => `
                                        <tr>
                                            <td><span class="param-name">${name}</span></td>
                                            <td><span class="param-type">${param.type}${param.enum ? ` (${param.enum.join("|")})` : ""}</span></td>
                                            <td><span class="${param.required ? "required" : "optional"}">${param.required ? "✓ Required" : "Optional"}</span></td>
                                            <td>${param.description}${param.default !== undefined ? ` (default: ${JSON.stringify(param.default)})` : ""}</td>
                                        </tr>
                                    `
                                      )
                                      .join("")}
                                </tbody>
                            </table>
                        </div>
                        `
                            : '<p><em>No parameters required</em></p>'
                        }

                        <div class="section">
                            <h4>Returns</h4>
                            <p><span class="param-type">${tool.returns.type}</span> - ${tool.returns.description}</p>
                        </div>

                        ${
                          tool.examples && tool.examples.length > 0
                            ? `
                        <div class="section">
                            <h4>Examples</h4>
                            ${tool.examples
                              .map(
                                (ex) => `
                                <div class="example">
                                    <h5>${ex.description}</h5>
                                    <strong>Request:</strong>
                                    <pre>${JSON.stringify(ex.request, null, 2)}</pre>
                                    <strong>Response:</strong>
                                    <pre>${JSON.stringify(ex.response, null, 2)}</pre>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        `
                            : ""
                        }

                        ${
                          tool.notes && tool.notes.length > 0
                            ? `
                        <div class="notes">
                            <strong>⚠️ Notes:</strong>
                            <ul>
                                ${tool.notes.map((note) => `<li>${note}</li>`).join("")}
                            </ul>
                        </div>
                        `
                            : ""
                        }
                    </div>
                `
                  )
                  .join("")}
            </div>
        `
          )
          .join("")}

        <footer>
            <p>Generated API Documentation for ${packageJson.name} v${packageJson.version}</p>
            <p>Built with Fastify, TypeScript, and Model Context Protocol</p>
        </footer>
    </div>
</body>
</html>
    `);
  });

  // JSON endpoint for machine-readable documentation
  fastify.get("/docs/json", async (request, reply) => {
    const categories = Array.from(
      new Set(tools.map((tool) => tool.category))
    ).sort();

    reply.type("application/json").send({
      openapi: "3.0.0",
      info: {
        title: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        license: {
          name: packageJson.license,
        },
      },
      servers: [
        {
          url: "/mcp",
          description: "MCP endpoint",
        },
      ],
      paths: Object.fromEntries(
        tools.map((tool) => [
          `/tools/${tool.name}`,
          {
            post: {
              summary: tool.description,
              tags: [tool.category],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: Object.fromEntries(
                        Object.entries(tool.parameters).map(([name, param]) => [
                          name,
                          {
                            type: param.type,
                            description: param.description,
                            ...(param.enum && { enum: param.enum }),
                            ...(param.default !== undefined && {
                              default: param.default,
                            }),
                            ...(param.minimum !== undefined && {
                              minimum: param.minimum,
                            }),
                            ...(param.maximum !== undefined && {
                              maximum: param.maximum,
                            }),
                          },
                        ])
                      ),
                      required: Object.entries(tool.parameters)
                        .filter(([, param]) => param.required)
                        .map(([name]) => name),
                    },
                    examples: tool.examples
                      ? Object.fromEntries(
                          tool.examples.map((ex, i) => [
                            `example${i + 1}`,
                            {
                              summary: ex.description,
                              value: ex.request,
                            },
                          ])
                        )
                      : undefined,
                  },
                },
              },
              responses: {
                "200": {
                  description: tool.returns.description,
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                      },
                      examples: tool.examples
                        ? Object.fromEntries(
                            tool.examples.map((ex, i) => [
                              `example${i + 1}`,
                              {
                                summary: ex.description,
                                value: ex.response,
                              },
                            ])
                          )
                        : undefined,
                    },
                  },
                },
              },
            },
          },
        ])
      ),
      tags: categories.map((cat) => ({
        name: cat,
        description: `${cat} operations`,
      })),
    });
  });
}
