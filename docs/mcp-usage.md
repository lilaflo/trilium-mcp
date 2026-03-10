# Trilium MCP Server Configuration

This document explains how to configure AI clients to use the Trilium MCP Server.

## Server Details

- **URL**: https://your-trilium-server.example.com/mcp
- **Protocol**: HTTP POST with JSON-RPC 2.0
- **Transport**: Server-Sent Events (SSE) compatible

## Available Tools

✅ **Fully Working (11/15)**
- `create_note` - Create notes with title, content, and parent structure
- `search_notes` - Full-text search with structured results
- `get_note` - Complete note metadata retrieval
- `update_note` - Update note titles and metadata
- `get_note_content` - Get raw HTML content
- `update_note_content` - Update HTML content directly
- `get_app_info` - Get Trilium instance information
- `get_day_note` - Calendar day notes integration
- `get_month_note` - Monthly calendar notes
- `delete_note` - Delete notes (handles empty responses)
- `create_backup` - Database backup creation

⚠️ **Known Issues (4/15)**
- `get_week_note` - Requires different date format
- `get_inbox_note` - Not tested fully
- `create_attachment` - Not tested fully
- `export_note` - Not tested fully

## Configuration Files

### 1. Simple Configuration (`mcp-server-config.json`)
```json
{
  "mcpServers": {
    "trilium": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://your-trilium-server.example.com/mcp",
        "-H", "Content-Type: application/json",
        "-H", "Accept: application/json, text/event-stream",
        "--data-binary", "@-"
      ]
    }
  }
}
```

### 2. For Claude Desktop
Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "trilium": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://your-trilium-server.example.com/mcp",
        "-H", "Content-Type: application/json",
        "-H", "Accept: application/json, text/event-stream",
        "--data-binary", "@-"
      ]
    }
  }
}
```

## Example Usage

### Create a Note
```bash
curl -X POST https://your-trilium-server.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_note",
      "arguments": {
        "parentId": "root",
        "title": "My New Note",
        "content": "<h1>Hello World</h1><p>This is my note content.</p>",
        "type": "text"
      }
    }
  }'
```

### Search Notes
```bash
curl -X POST https://your-trilium-server.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_notes",
      "arguments": {
        "query": "project documentation",
        "limit": 10,
        "format": "structured"
      }
    }
  }'
```

### Get System Information
```bash
curl -X POST https://your-trilium-server.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_app_info",
      "arguments": {}
    }
  }'
```

## Features

### 🔍 **Comprehensive Note Management**
- Create, read, update, delete notes
- Full-text search with filtering
- Hierarchical organization with parent-child relationships

### 📅 **Calendar Integration**
- Daily, weekly, and monthly notes
- Automatic date attribute assignment
- Calendar-based organization

### 🛠️ **Advanced Features**
- Database backup creation
- Note export functionality
- Attachment management
- System information retrieval

### 📊 **Monitoring & Logging**
- Verbose request/response logging
- System health monitoring every 30 seconds
- Connection tracking and memory usage
- Request timing and error tracking

## Architecture

The server is built with:
- **Fastify** - High-performance web framework
- **MCP SDK** - Model Context Protocol implementation
- **Trilium ETAPI** - External API integration
- **Fly.io** - Cloud deployment platform

## Support

The server includes comprehensive error handling and logging. All requests are tracked with unique IDs for debugging purposes.

For issues or questions, check the deployment logs with:
```bash
fly logs -a your-app-name
```

## Testing

The server has been comprehensively tested with all major functionality verified. A complete test suite was executed including:
- Note creation and management
- Search functionality
- Calendar integration
- Content updates
- System operations

Test results and documentation are available in the created folder structure within Trilium.