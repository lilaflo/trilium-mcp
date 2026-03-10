# Test Implementation Plan

## Overview

This plan outlines the step-by-step approach to implement missing unit tests for the Trilium MCP Server project.

---

## Current Test Status

- **Session Tests**: 26 tests covering session management (FAILING - Jest config issue)
- **Docs Tests**: 10 tests for documentation routes (FAILING - Jest config issue)
- **Simple Tests**: 29 tests for core functionality (PASSING - 0% coverage)
- **Test Failures**: TypeError with babel-plugin-istanbul and test-exclude

---

## Phase 1: Fix Jest Configuration (Priority: HIGH)

### Issue
The test failures are caused by compatibility issues between Jest 30.x, babel-plugin-istanbul, and test-exclude packages.

### Solution
Downgrade Jest to 29.x or add proper ESM transform ignore patterns.

### Steps

1. **Downgrade Jest** in package.json:
   ```json
   "jest": "^29.7.0",
   "@jest/globals": "^29.7.0",
   "@types/jest": "^29.5.14"
   ```

2. **Add transformIgnorePatterns** to jest.config.cjs:
   ```javascript
   transformIgnorePatterns: [
     'node_modules/(?!(test-exclude|babel-plugin-istanbul)/)'
   ]
   ```

3. **Run tests** to verify fix:
   ```bash
   pnpm install
   pnpm test
   ```

---

## Phase 2: Add Tool Unit Tests (Priority: HIGH)

### Test Structure

Create test files following the pattern: `tests/tools/<category>/<tool>.test.ts`

Each test should:
- Mock the fetch function
- Test input validation
- Test success cases
- Test error handling
- Test edge cases

### 2.1 Core Note Tools (6 tools)

| Tool | Test File | Key Tests |
|------|-----------|-----------|
| `create_note` | `tests/tools/core/create-note.test.ts` | Valid parentId, empty title, missing required fields, ETAPI error |
| `get_note` | `tests/tools/core/get-note.test.ts` | Valid noteId, deleted note, non-existent note |
| `get_note_content` | `tests/tools/core/get-note-content.test.ts` | Plain text, markdown, HTML content |
| `update_note` | `tests/tools/core/update-note.test.ts` | Title only, content only, both, partial updates |
| `move_note` | `tests/tools/core/move-note.test.ts` | Valid move, invalid target, same parent |
| `delete_note` | `tests/tools/core/delete-note.test.ts` | Soft delete, cascade delete, non-existent note |

### 2.2 Search Tools (1 tool)

| Tool | Test File | Key Tests |
|------|-----------|-----------|
| `search_notes` | `tests/tools/search/search-notes.test.ts` | Basic search, filters (type, tag), pagination, no results |

### 2.3 Calendar Tools (1 tool)

| Tool | Test File | Key Tests |
|------|-----------|-----------|
| `get_calendar_note` | `tests/tools/calendar/get-calendar-note.test.ts` | Day note, week note (ISO format), month note, inbox note |

### 2.4 File/Attachment Tools (1 tool)

| Tool | Test File | Key Tests |
|------|-----------|-----------|
| `create_attachment` | `tests/tools/files/create-attachment.test.ts` | Base64 content, invalid base64, MIME type, size limits |

### 2.5 System Tools (3 tools)

| Tool | Test File | Key Tests |
|------|-----------|-----------|
| `get_app_info` | `tests/tools/system/get-app-info.test.ts` | Version info, db version, node version |
| `export_note` | `tests/tools/system/export-note.test.ts` | ZIP format, note not found |
| `create_backup` | `tests/tools/system/create-backup.test.ts` | Success response, empty body handling |

---

## Phase 3: Add Integration Tests (Priority: MEDIUM)

### 3.1 Tool Chains

Create `tests/integration/tool-chains.test.ts`:

- Create note → Update note → Delete note
- Create note → Search for it → Get content
- Create note → Create attachment → Export note

### 3.2 Session Lifecycle

Create `tests/integration/session-lifecycle.test.ts`:

- Create session → Validate session → Use session → Session expires
- Concurrent session creation with rate limiting
- Session cleanup on expiration

---

## Phase 4: Add Error Handling Tests (Priority: MEDIUM)

### 4.1 Network Errors

Create `tests/error/network-errors.test.ts`:

- ETAPI timeout handling
- Connection refused
- Invalid JSON response

### 4.2 Invalid Requests

Create `tests/error/invalid-requests.test.ts`:

- Invalid JSON-RPC format
- Missing method/params
- Malformed tool arguments

---

## Phase 5: Type & Validation Tests (Priority: MEDIUM)

### 5.1 Zod Schema Validation

Create `tests/validation/zod-schemas.test.ts`:

- Test each tool's inputSchema
- Test default values
- Test optional fields
- Test required field validation

---

## Phase 6: Performance & Edge Cases (Priority: LOW)

### 6.1 Large Payloads

Create `tests/performance/large-payloads.test.ts`:

- 10MB note content
- Large search results
- Many attachments

### 6.2 Concurrency

Create `tests/performance/concurrency.test.ts`:

- 100+ concurrent sessions
- Rapid session creation
- Memory cleanup verification

---

## Implementation Order

```
Phase 1: Fix Jest Configuration (Day 1)
  ├── 1.1 Downgrade Jest to 29.x
  ├── 1.2 Update transformIgnorePatterns
  ├── 1.3 Verify all tests pass
  └── 1.4 Generate baseline coverage

Phase 2: Tool Unit Tests (Days 2-5)
  ├── 2.1 Core Note Tools (Day 2)
  ├── 2.2 Search Tools (Day 3)
  ├── 2.3 Calendar Tools (Day 3)
  ├── 2.4 File Tools (Day 4)
  └── 2.5 System Tools (Day 5)

Phase 3: Integration Tests (Day 6)
  ├── 3.1 Tool Chains
  └── 3.2 Session Lifecycle

Phase 4: Error Handling (Day 7)
  ├── 4.1 Network Errors
  └── 4.2 Invalid Requests

Phase 5: Validation Tests (Day 8)
  └── 5.1 Zod Schema Tests

Phase 6: Performance Tests (Day 9)
  ├── 6.1 Large Payloads
  └── 6.2 Concurrency

Phase 7: Final Verification (Day 10)
  ├── 7.1 Full test run
  ├── 7.2 Coverage report
  └── 7.3 Update AGENTS.md
```

---

## Test Code Template

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { setupFetchMock } from '../mocks.js';
import { toolFunction } from '../../tools/category/tool-name.js';

describe('Tool Name', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  it('should handle success case', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ /* mock response */ }),
    } as Response);

    const result = await toolFunction({ /* params */ });
    expect(result).toMatchObject({ /* expected */ });
  });

  it('should handle error case', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    } as Response);

    await expect(toolFunction({ /* params */ })).rejects.toThrow();
  });

  it('should validate input schema', async () => {
    // Test Zod validation
  });
});
```

---

## Coverage Targets

| Phase | Coverage Target |
|-------|-----------------|
| Baseline (current) | 0% |
| After Phase 1 | 20% |
| After Phase 2 | 60% |
| After Phase 3 | 75% |
| After Phase 4 | 85% |
| After Phase 5 | 90% |
| After Phase 6 | 95% |

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "msw": "^2.0.0"
  }
}
```

MSW (Mock Service Worker) can be used for more advanced HTTP mocking if needed.

---

## Notes

1. **Test Naming**: Use descriptive names like `create-note.test.ts`
2. **Mock Strategy**: Reuse existing `tests/mocks.ts` for fetch mocking
3. **Isolation**: Each test should be independent
4. **Coverage**: Run `pnpm test:coverage` after each phase
5. **Commit**: Commit after each phase with conventional commit format

---

## Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- tools/core/create-note.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="create_note"
```

---

## References

- Jest ESM: https://jestjs.io/docs/ecmascript-modules
- Zod Testing: https://zod.dev/?id=testing
- MCP SDK: https://modelcontextprotocol.info/
