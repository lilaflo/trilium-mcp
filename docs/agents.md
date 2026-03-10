# AGENTS.md - Guidelines for AI Agents

This file provides guidance for AI agents working on this codebase.

## Project Overview

Trilium MCP Server - A Model Context Protocol server that exposes Trilium Notes ETAPI functionality. Built with Fastify, TypeScript ES modules.

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

### Running a Single Test
```bash
pnpm test -- simple.test.ts                    # Single file
pnpm test -- --testNamePattern="create_note"  # Single test by name
pnpm test -- simple.test.ts -t "create_note"  # Combined
```

### Linting
```bash
# No lint script currently configured - add one if needed
```

## Code Style Guidelines

### TypeScript ES Modules
- Package type is `"module"` in package.json
- **Always use `.js` extension for local imports** (e.g., `import x from "./foo.js"`)
- This is required for ESM compatibility with Jest and Node

### Imports
- Use named imports where possible: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"`
- JSON imports require `{ type: "json" }`: `import packageJson from "../package.json" with { type: "json" }`
- Group imports: external libs first, then local imports

### Logging
- **Use `console.debug()` for JavaScript debugging info** (not `console.log`)
- Use `console.log()` for important startup/runtime messages
- Use `console.error()` for errors
- Include timestamps and request IDs in logs: `` `[${new Date().toISOString()}] [REQUEST-${id}] message` ``

### Naming Conventions
- Files: kebab-case (`mcp-trilium-server.ts`, `trilium-tools.ts`)
- Functions: camelCase (`registerTools`, `etapi`)
- Interfaces/Types: PascalCase (`ETAPIOptions`, `McpServer`)
- Constants: UPPER_SNAKE_CASE within functions, camelCase at module level

### Error Handling
- Always use try/catch for async operations
- Format errors consistently using `formatError()` helper from `tools/etapi.ts`
- Return error responses with `isError: true` and proper JSON structure
- Handle empty responses (204 No Content) explicitly

### Tool Implementation
- Tools use Zod for input validation via `inputSchema`
- Use descriptive `.describe()` calls for all schema fields
- Return `{ content: [{ type: "text", text: JSON.stringify(...) }] }` format
- Include proper error handling in each tool handler

### Testing
- Tests go in `tests/` directory
- Test files: `*.test.ts`
- Use Jest with ESM support
- Mock all external ETAPI calls using `tests/mocks.ts`
- Mock environment variables in `tests/setup.ts`
- Use `setupFetchMock()` helper for fetch mocking

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupFetchMock } from './mocks.js';

describe('Feature Name', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

### Configuration Files
- `jest.config.cjs` - Jest ESM configuration
- `package.json` - Project metadata, dependencies, scripts

### Environment Variables
Required:
- `TRILIUM_URL` - Trilium ETAPI base URL (must include `/etapi` path)
- `TRILIUM_TOKEN` - ETAPI authentication token

Optional:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, production, test)

## Architecture Patterns

### Request Flow
1. Client sends POST to `/mcp` with optional `Mcp-Session-Id` header
2. If session exists, reuse existing transport/server; otherwise create new
3. `Mcp-Session-Id` header returned for new sessions
4. DELETE `/mcp` terminates sessions
5. GET `/mcp` returns 405 (SSE not supported)

### Session Management
- Sessions stored in-memory Map by sessionId
- Transport created with `sessionIdGenerator` for new sessions
- DNS rebinding protection enabled (`enableDnsRebindingProtection: true`)
- DELETE endpoint properly terminates sessions and cleans up resources

#### Session Expiration
- `SESSION_TTL` - Session lifetime (default: 5m, format: `30s`, `5m`, `1h`)
- Sessions automatically expire after TTL and are invalidated on next access
- Secure UUIDs used for session IDs (fallback to Math.random if crypto unavailable)
- Session ID validation: 16-128 characters required
- Rate limiting: max 1 new session per 5 seconds (returns 429)

Example:
```bash
SESSION_TTL=10m pnpm start  # 10 minute session timeout
```

### Tool Organization
- Core tools: `tools/core/` (create, get, update, delete notes)
- Search: `tools/search/` (search-notes)
- Calendar: `tools/calendar/` (day, week, month notes)
- Files: `tools/files/` (attachments)
- System: `tools/system/` (app-info, export, backup)

### MCP Response Format
```typescript
// Success
{ content: [{ type: "text", text: JSON.stringify(data) }] }

// Error
{ content: [{ type: "text", text: JSON.stringify({ error, message }) }], isError: true }
```

## Known Issues
1. `get_week_note` requires ISO week format `"2025-W39"` not `"2025-09-29"`
2. `export_note` returns binary ZIP but expects JSON handling
3. `create_backup` returns empty response, needs special handling

## Dependencies

### Jest & Testing
- Jest 30.x requires pnpm overrides for babel-plugin-istanbul and test-exclude:
```json
"pnpm": {
  "overrides": {
    "babel-plugin-istanbul": "^7.0.0",
    "test-exclude": "^7.0.0"
  }
}
```
This fixes ESM compatibility issues with coverage instrumentation.

## Test Coverage

### Test Files
- `tests/session.test.ts` - 26 tests for session management
- `tests/docs.test.ts` - 20 tests for API documentation routes
- `tests/simple.test.ts` - 29 tests for core functionality
- `tests/tools/core/etapi-utils.test.ts` - 24 tests for ETAPI utilities & schemas
- `tests/tools/search/search-notes.test.ts` - 20 tests for search
- `tests/tools/calendar/get-calendar-note.test.ts` - 19 tests for calendar
- `tests/tools/files/create-attachment.test.ts` - 24 tests for attachments
- `tests/tools/system/system-tools.test.ts` - 28 tests for system tools

### Coverage Targets
- `docs.ts`: 100%
- `session-manager.ts`: 96%
- Overall: 99%+
