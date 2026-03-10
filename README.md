# Trilium MCP Server

A comprehensive Model Context Protocol (MCP) server for [Trilium Notes](https://github.com/TriliumNext/Trilium) integration, providing complete note management functionality through MCP-compatible AI clients.

🚀 **Production Ready** • 🔧 **15 API Endpoints** • 📊 **208 Tests** • 🏥 **Health Monitoring** • 📚 **Interactive API Docs**

**Live Server**: https://your-trilium-server.example.com/mcp

## Features

- **Complete Note Management**: Create, read, update, delete, and search notes
- **Rich Content Support**: HTML content with formatting and attachments
- **Calendar Integration**: Day, week, and month notes with automatic organization
- **Advanced Search**: Full-text search with filtering and structured results
- **File Attachments**: Base64-encoded file attachment support
- **System Operations**: Backup creation, export functionality, and system info
- **Interactive API Documentation**: Beautiful HTML docs with examples and OpenAPI JSON export
- **Verbose Logging**: Comprehensive request tracking and health monitoring
- **Production Deployment**: HTTPS endpoint with authentication and error handling

## API Documentation

For complete API documentation, see [API Reference](./docs/api-reference.md).

**Interactive Documentation**: Visit `/docs` for complete API documentation with:
- All 15 endpoints organized by category
- Request/response examples
- Parameter descriptions with types and constraints
- Known issues and workarounds
- OpenAPI 3.0 JSON export at `/docs/json`
- **MCP Manifest** at `/mcp.json` (JSON-RPC `tools/list` format)

## Quick Start

### For AI Clients (Recommended)

1. **Copy configuration** from `mcp-server-config.json`:

```json
{
  "mcpServers": {
    "trilium": {
      "command": "curl",
      "args": [
        "-X",
        "POST",
        "https://your-trilium-server.example.com/mcp",
        "-H",
        "Content-Type: application/json",
        "-H",
        "Accept: application/json, text/event-stream",
        "--data-binary",
        "@-"
      ]
    }
  }
}
```

2. **Import into your AI client**:

   - **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
   - **Other MCP clients**: Use the universal configuration

3. **Start using** - All 15 tools will be available immediately!

### Direct HTTP Testing

```bash
# Test note creation
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
        "title": "API Test Note",
        "content": "<h1>Hello from MCP!</h1><p>This note was created via the API.</p>"
      }
    }
  }'

# Test search functionality
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
        "query": "API Test",
        "limit": 5,
        "format": "structured"
      }
    }
  }'

# Get system information
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

## Local Development

### Prerequisites

- Node.js 18+
- pnpm package manager
- Trilium Notes instance with ETAPI enabled

### Setup

1. **Clone and install**:

```bash
git clone <repository-url>
cd trilium-mcp
pnpm install
```

2. **Configure environment**:

```bash
cp .env.example .env
# Edit .env with your Trilium URL and token
```

3. **Start development server**:

```bash
pnpm dev  # Auto-reload enabled
# or
pnpm start  # Production mode
```

4. **Health check**:

```bash
curl http://localhost:3000/health
```

### Environment Variables

| Variable        | Description                               | Required | Default     |
| --------------- | ----------------------------------------- | -------- | ----------- |
| `TRILIUM_URL`   | Trilium ETAPI URL (include `/etapi` path) | ✅       | -           |
| `TRILIUM_TOKEN` | ETAPI authentication token                | ✅       | -           |
| `PORT`          | HTTP server port                          | ❌       | 3000        |
| `NODE_ENV`      | Environment mode                          | ❌       | development |

## Production Features

### Comprehensive Logging

- **Request tracking**: Unique IDs for every MCP request with timing
- **ETAPI monitoring**: All Trilium API calls logged with request/response details
- **Health monitoring**: System stats every 30 seconds (memory, connections, uptime)
- **Error handling**: Full stack traces and detailed error messages
- **Connection tracking**: Active/total connection counts with lifecycle logging

### Health Monitoring

```bash
# View server health
curl https://my-own-trilium-mcp.fly.dev/health

# View API documentation
curl https://my-own-trilium-mcp.fly.dev/docs

# Get OpenAPI JSON spec
curl https://my-own-trilium-mcp.fly.dev/docs/json

# Get MCP Manifest (tools/list format)
curl https://my-own-trilium-mcp.fly.dev/mcp.json

# Monitor deployment logs
fly logs -a your-app-name
```

### Security

- **HTTPS deployment** with proper TLS
- **ETAPI authentication** with Basic Auth
- **CORS enabled** for cross-origin requests
- **Request validation** with MCP protocol compliance
- **Error sanitization** without sensitive data leakage

## Performance Metrics

Based on comprehensive testing:

- **Response Times**: 100-300ms average for most operations
- **Memory Usage**: ~99MB RSS, stable memory footprint
- **Connection Handling**: Proper cleanup and resource management
- **Uptime**: Production-stable with comprehensive error handling
- **Success Rate**: 13/15 endpoints (87%) fully working

## Testing Results

The server has been comprehensively tested with real-world scenarios:

✅ **Created nested folder structure** with rich HTML content
✅ **All CRUD operations** tested with actual data
✅ **Calendar integration** verified with daily/monthly notes
✅ **File attachments** tested with base64 encoding
✅ **Search functionality** confirmed with structured results
✅ **System operations** validated including backups and info retrieval

See [Final Test Results](./docs/final-test-results.md) for complete testing documentation.

## Additional Resources

- [API Reference](./docs/api-reference.md) - Complete endpoint documentation
- [MCP Usage Guide](./docs/mcp-usage.md) - User guide for operating the MCP server
- [Trilium Notes](https://github.com/TriliumNext/Trilium) - The note-taking application
- [Model Context Protocol](https://modelcontextprotocol.io/) - The underlying protocol
- [Trilium ETAPI Docs](https://github.com/TriliumNext/Trilium/wiki/ETAPI) - External API documentation

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to use!** 🎉 Import the configuration files into your favorite MCP-compatible AI client and start managing your Trilium notes with AI assistance.
