# Claude Development Notes

## Project Overview
Trilium MCP Server - A comprehensive Model Context Protocol server for Trilium Notes integration with 15 API endpoints, Jest testing, and production deployment.

## Key References
- Use https://github.com/TriliumNext/Trilium as Trilium github project page
- Trilium ETAPI Documentation: https://github.com/TriliumNext/Trilium/wiki/ETAPI
- Model Context Protocol: https://modelcontextprotocol.io/

## Development History

### Major Milestones
1. **Initial MCP Server** - Basic Trilium ETAPI integration
2. **Verbose Logging** - Added comprehensive request tracking and health monitoring
3. **Jest Testing Framework** - Complete test suite with 25 passing tests
4. **Repository Sanitization** - Removed private endpoints from git history using BFG

### Current Status (Production Ready)
- ✅ 15 MCP Tools fully implemented (13/15 working, 2 with minor issues)
- ✅ Comprehensive Jest test suite (25/25 tests passing)
- ✅ Verbose logging with request tracking and health monitoring
- ✅ Complete documentation (README, API docs, test results)
- ✅ Anonymous configuration files for public sharing
- ✅ Git history completely sanitized

### Testing Commands
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with detailed output
pnpm test:verbose
```

### Known Issues
1. `get_week_note` - Requires specific date format (e.g., "2025-W39" instead of "2025-09-29")
2. `export_note` - Returns binary ZIP data but expects JSON response handling

### Architecture Notes
- **Server**: Fastify with MCP SDK integration
- **Authentication**: ETAPI Basic Auth with token
- **Logging**: Comprehensive request/response tracking with unique IDs
- **Testing**: Jest with ES module support and ETAPI mocking
- **Deployment**: Fly.io with HTTPS and health monitoring

### File Structure
```
trilium-mcp/
├── mcp-trilium-server.ts     # Main server file
├── tools/trilium-tools.ts    # All 15 MCP tool implementations
├── routes/mcp.ts            # MCP route handler
├── tests/                   # Jest test suite
│   ├── simple.test.ts       # 25 working tests
│   ├── setup.ts            # Test environment setup
│   └── mocks.ts            # ETAPI mock responses
├── jest.config.cjs          # Jest configuration
├── README.md               # Complete API documentation
├── FINAL-TEST-RESULTS.md   # Comprehensive test results
└── MCP-USAGE.md           # Usage and configuration guide
```

## Development Guidelines

### Code Standards
- TypeScript with ES modules
- Comprehensive error handling
- Verbose logging with unique request IDs
- Jest unit testing for all functionality
- Generic examples in documentation

### Security
- Never commit actual server endpoints
- Use environment variables for sensitive data
- Sanitize error messages in responses
- Maintain authentication through ETAPI tokens

### Testing Requirements
- All new features must include Jest tests
- Tests must pass before deployment
- Mock all external ETAPI calls
- Maintain 100% test coverage for core functionality