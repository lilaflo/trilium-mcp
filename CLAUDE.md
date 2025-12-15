# CLAUDE.md

This file provides guidance to instances when working with code in this repository.

## Project Overview
Trilium MCP Server - A Model Context Protocol server that exposes Trilium Notes ETAPI functionality through 15 MCP tools. Built with Fastify, TypeScript ES modules, and deployed to Fly.io.

## Development Commands

### Running the Server
```bash
pnpm start              # Production mode with dotenvx
pnpm dev                # Development mode with auto-reload (--watch)
PORT=3001 pnpm start    # Custom port (default: 3000)
```

### Testing
```bash
pnpm test               # Run all tests
pnpm test:watch         # Watch mode for development
pnpm test:coverage      # Generate coverage report
pnpm test:verbose       # Detailed test output
```

### Deployment
```bash
fly deploy              # Deploy to Fly.io
fly logs                # View production logs
fly status              # Check deployment status
fly secrets set TRILIUM_URL=... TRILIUM_TOKEN=...  # Set secrets
```

## Architecture

### Server Structure
- **mcp-trilium-server.ts** - Main entry point, Fastify setup, health monitoring
  - Logs system health every 30s (memory, connections, uptime)
  - Tracks active/total connections globally
  - Validates TRILIUM_URL and TRILIUM_TOKEN on startup

- **routes/mcp.ts** - POST /mcp endpoint handler
  - Creates fresh McpServer + transport per request (stateless)
  - Generates unique requestId for logging correlation
  - Properly closes transport/server on connection close

- **routes/health.ts** - GET /health endpoint for monitoring

### Tool Implementation
- **tools/index.ts** - Tool registration entry point
- **tools/trilium-tools.ts** - All 15 MCP tool definitions with Zod schemas
- **tools/etapi.ts** - Trilium ETAPI client wrapper
  - Handles authentication with Basic Auth (etapi:TOKEN)
  - Verbose request/response logging with unique IDs
  - Base64 encoding for ETAPI token

### Testing Setup
- **tests/setup.ts** - Jest environment configuration
- **tests/mocks.ts** - Mock ETAPI responses for all endpoints
- **tests/simple.test.ts** - 25 test cases (all passing)
- Uses ts-jest with ESM support
- Mocks all external ETAPI calls

## Key Technical Details

### TypeScript ES Modules
- **Type**: `"module"` in package.json
- **Imports**: Always use `.js` extension for local imports (e.g., `./routes/mcp.js`)
- **Jest**: Configured with `extensionsToTreatAsEsm` and module name mapper
- **JSON imports**: Use `with { type: "json" }` syntax

### MCP Integration
- Uses `@modelcontextprotocol/sdk` for server and transport
- StreamableHTTPServerTransport in stateless mode (no session IDs)
- Each POST request creates isolated server instance
- Tools defined with Zod schemas, auto-converted to JSON Schema

### ETAPI Communication
- **Base URL**: Must include `/etapi` path (e.g., `https://example.com/etapi`)
- **Auth**: Basic Auth with `etapi:TOKEN` base64-encoded
- **Logging**: Every ETAPI call logged with unique ID, timing, headers, body
- **Error handling**: Propagates ETAPI errors with status codes

### Known Tool Issues
1. **get_week_note**: Requires ISO week format `"2025-W39"` not `"2025-09-29"`
2. **export_note**: Returns binary ZIP but expects JSON handling
3. **create_backup**: Returns empty response, needs special handling

## Environment Variables
- **TRILIUM_URL** (required): Trilium ETAPI base URL with `/etapi` path
- **TRILIUM_TOKEN** (required): ETAPI authentication token
- **PORT** (optional): HTTP server port, default 3000

## Important Patterns

### Logging
- Use `console.debug()` for JavaScript debugging info (not `console.log`)
- Include timestamp, requestId, and context in all logs
- Track request timing with startTime/endTime

### Error Handling
- ETAPI errors include status code and response body
- Empty responses (204) handled specially for delete/backup operations
- All errors logged with full stack traces

### Testing
- All ETAPI calls must be mocked in tests
- Use unique request IDs for tracing
- Test both success and error scenarios
- Mock responses match real ETAPI structure

## Key References
- Trilium GitHub: https://github.com/TriliumNext/Trilium
- ETAPI Documentation: https://github.com/TriliumNext/Trilium/wiki/ETAPI
- Model Context Protocol: https://modelcontextprotocol.io/
- See `ETAPI_Technical_Reference.md` for detailed ETAPI documentation
- See `FINAL-TEST-RESULTS.md` for comprehensive test results

## Security Notes
- Never commit actual TRILIUM_URL or TRILIUM_TOKEN values
- Use .env.dist for example configuration
- Sanitize error messages before returning to clients
- ETAPI token stored in environment, not code
- Add .claude/settings.local.json to .gitignore
