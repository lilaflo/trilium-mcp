# Trilium ETAPI Technical Reference

Based on source code analysis of the Trilium Next project, this document provides comprehensive technical documentation for the External Trilium API (ETAPI).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Core Endpoints](#core-endpoints)
4. [Data Models](#data-models)
5. [Search Implementation](#search-implementation)
6. [Calendar Integration](#calendar-integration)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Implementation Examples](#implementation-examples)

## Architecture Overview

The ETAPI is implemented as a RESTful web service built on Express.js. Key architectural components:

- **Base Path**: `/etapi/`
- **Route Registration**: Located in `/apps/server/src/routes/routes.ts` (lines 361-370)
- **Core Implementation**: `/apps/server/src/etapi/` directory
- **Authentication**: Token-based authentication with optional Basic Auth support
- **Data Validation**: Comprehensive input validation using custom validators
- **Error Handling**: Structured error responses with consistent format

### Route Structure

```typescript
// Main ETAPI route modules
etapiAuthRoutes.register(router, [loginRateLimiter]);
etapiAppInfoRoutes.register(router);
etapiAttachmentRoutes.register(router);
etapiAttributeRoutes.register(router);
etapiBranchRoutes.register(router);
etapiNoteRoutes.register(router);
etapiSpecialNoteRoutes.register(router);
etapiSpecRoute.register(router);
etapiBackupRoute.register(router);
etapiMetricsRoute.register(router);
```

## Authentication & Authorization

### Authentication Mechanisms

The ETAPI supports three authentication formats:

1. **Direct Token**: `{etapiTokenId}_{token}`
2. **Bearer Token**: `Authorization: Bearer {etapiTokenId}_{token}`
3. **Basic Authentication**: `Authorization: Basic {base64(etapi:{etapiTokenId}_{token})}`

### Token Management

**Token Creation Endpoint**: `POST /etapi/auth/login`

```typescript
interface LoginRequest {
  password: string; // Trilium instance password
  tokenName?: string; // Optional token name (default: "ETAPI login")
}

interface LoginResponse {
  authToken: string; // Format: "{etapiTokenId}_{token}"
}
```

**Token Validation Process**:

1. Parse authorization header (supports Bearer, Basic, or direct token)
2. Extract `etapiTokenId` and `token` components
3. Hash the token using SHA-256
4. Compare against stored `tokenHash` in database
5. Validate token is not deleted

**Token Logout**: `POST /etapi/auth/logout`

- Requires valid authentication
- Marks the token as deleted
- Returns `204 No Content`

### Rate Limiting

Authentication endpoints have rate limiting:

- **Window**: 15 minutes
- **Max Attempts**: 10 per IP
- **Scope**: Login attempts only (successful API calls don't count)

## Core Endpoints

### Notes API

#### Search Notes

`GET /etapi/notes?search={query}`

**Query Parameters**:

```typescript
interface SearchParams {
  search: string; // Required: Search query
  fastSearch?: boolean; // Optional: Skip content search
  includeArchivedNotes?: boolean; // Optional: Include archived notes
  ancestorNoteId?: string; // Optional: Limit to subtree
  ancestorDepth?: string; // Optional: Depth constraint (eq1, lt4, etc.)
  orderBy?: string; // Optional: Sort field
  orderDirection?: "asc" | "desc"; // Optional: Sort direction
  limit?: number; // Optional: Result limit
  debug?: boolean; // Optional: Include debug info
}
```

**Response**:

```typescript
interface SearchResponse {
  results: NotePojo[];
  debugInfo?: any; // Only included if debug=true
}
```

#### Get Note

`GET /etapi/notes/{noteId}`

Returns complete note metadata including relationships:

```typescript
interface NotePojo {
  noteId: string;
  isProtected: boolean;
  title: string;
  type: NoteType;
  mime: string;
  blobId: string;
  dateCreated: string;
  dateModified: string;
  utcDateCreated: string;
  utcDateModified: string;
  parentNoteIds: string[];
  childNoteIds: string[];
  parentBranchIds: string[];
  childBranchIds: string[];
  attributes: AttributePojo[];
}
```

#### Create Note

`POST /etapi/create-note`

**Request Body**:

```typescript
interface CreateNoteRequest {
  parentNoteId: string; // Required: Parent note ID
  title: string; // Required: Note title
  type: NoteType; // Required: Note type
  mime?: string; // Optional: MIME type
  content?: string; // Optional: Note content
  notePosition?: number; // Optional: Position in parent
  prefix?: string; // Optional: Branch prefix
  isExpanded?: boolean; // Optional: Initial expanded state
  noteId?: string; // Optional: Custom note ID
  dateCreated?: string; // Optional: Creation date
  utcDateCreated?: string; // Optional: UTC creation date
}
```

**Validation Rules**:

- `parentNoteId`: Must be valid existing note ID
- `title`: Required, non-null string
- `type`: Must be valid note type (text, code, file, image, etc.)
- `noteId`: Must match pattern `/^[A-Za-z0-9_]{4,128}$/`
- Date fields: Must be valid ISO datetime strings

#### Update Note

`PATCH /etapi/notes/{noteId}`

**Allowed Properties**:

```typescript
interface UpdateNoteRequest {
  title?: string; // Note title
  type?: string; // Note type
  mime?: string; // MIME type
  dateCreated?: string; // Local creation date
  utcDateCreated?: string; // UTC creation date
}
```

**Restrictions**:

- Protected notes cannot be modified via ETAPI
- Automatically creates revision before modification

#### Note Content

`GET /etapi/notes/{noteId}/content` - Get note content
`PUT /etapi/notes/{noteId}/content` - Update note content

Content endpoints:

- Set appropriate `Content-Type` headers
- Handle binary content correctly
- Protected notes return 400 error
- Automatically trigger post-processing for certain note types

#### Note Operations

- `DELETE /etapi/notes/{noteId}` - Delete note
- `POST /etapi/notes/{noteId}/revision` - Force save revision
- `GET /etapi/notes/{noteId}/export` - Export note (HTML/Markdown)
- `POST /etapi/notes/{noteId}/import` - Import ZIP content
- `GET /etapi/notes/{noteId}/attachments` - Get note attachments

### Branches API

Branches represent parent-child relationships between notes.

#### Get Branch

`GET /etapi/branches/{branchId}`

#### Create Branch

`POST /etapi/branches`

```typescript
interface CreateBranchRequest {
  noteId: string; // Required: Child note ID
  parentNoteId: string; // Required: Parent note ID
  notePosition?: number; // Optional: Position in parent
  prefix?: string; // Optional: Branch prefix
  isExpanded?: boolean; // Optional: Expanded state
}
```

**Special Behavior**:

- If branch already exists, updates existing branch instead of creating new one
- Returns 200 for updates, 201 for new branches

#### Update Branch

`PATCH /etapi/branches/{branchId}`

#### Delete Branch

`DELETE /etapi/branches/{branchId}`

#### Note Ordering

`POST /etapi/refresh-note-ordering/{parentNoteId}`

- Triggers note reordering for parent note children
- Used to refresh UI after position changes

### Attributes API

Attributes are labels and relations attached to notes.

#### Get Attribute

`GET /etapi/attributes/{attributeId}`

#### Create Attribute

`POST /etapi/attributes`

```typescript
interface CreateAttributeRequest {
  attributeId: string; // Required: Custom attribute ID
  noteId: string; // Required: Owner note ID
  type: "label" | "relation"; // Required: Attribute type
  name: string; // Required: Attribute name
  value?: string; // Optional: Attribute value
  isInheritable?: boolean; // Optional: Inheritance flag
  position?: number; // Optional: Sort position
}
```

**Validation**:

- Relations require `value` to be valid note ID
- `attributeId` must match entity ID pattern
- `type` restricted to "label" or "relation"

#### Update Attribute

`PATCH /etapi/attributes/{attributeId}`

**Different rules for labels vs relations**:

- **Labels**: Can update `value` and `position`
- **Relations**: Can only update `position` (value changes require delete/create)

### Attachments API

#### Get Attachment

`GET /etapi/attachments/{attachmentId}`

#### Create Attachment

`POST /etapi/attachments`

```typescript
interface CreateAttachmentRequest {
  ownerId: string; // Required: Owner note ID
  role: string; // Required: Attachment role
  mime: string; // Required: MIME type
  title: string; // Required: Attachment title
  position?: number; // Optional: Sort position
  content?: string; // Optional: Initial content
}
```

#### Attachment Content

- `GET /etapi/attachments/{attachmentId}/content` - Get attachment content
- `PUT /etapi/attachments/{attachmentId}/content` - Update attachment content

### Special Notes API (Calendar Integration)

#### Date-based Notes

- `GET /etapi/inbox/{date}` - Get inbox note for date (YYYY-MM-DD)
- `GET /etapi/calendar/days/{date}` - Get day note (YYYY-MM-DD)
- `GET /etapi/calendar/week-first-day/{date}` - Get week first day note
- `GET /etapi/calendar/weeks/{week}` - Get week note (YYYY-W##)
- `GET /etapi/calendar/months/{month}` - Get month note (YYYY-MM)
- `GET /etapi/calendar/years/{year}` - Get year note (YYYY)

**Validation Patterns**:

- Date: `/[0-9]{4}-[0-9]{2}-[0-9]{2}/`
- Week: `/[0-9]{4}-W[0-9]{2}/`
- Month: `/[0-9]{4}-[0-9]{2}/`
- Year: `/[0-9]{4}/`

### System APIs

#### App Info

`GET /etapi/app-info` - Get application information

#### Metrics

`GET /etapi/metrics?format={format}`

**Formats**:

- `prometheus` (default): Prometheus metrics format
- `json`: JSON format

**Metrics Include**:

```typescript
interface MetricsData {
  version: {
    app: string;
    db: number;
    node: string;
    sync: number;
    buildDate: string;
    buildRevision: string;
  };
  database: {
    totalNotes: number;
    deletedNotes: number;
    activeNotes: number;
    protectedNotes: number;
    totalAttachments: number;
    deletedAttachments: number;
    activeAttachments: number;
    totalRevisions: number;
    totalBranches: number;
    totalAttributes: number;
    totalBlobs: number;
    totalEtapiTokens: number;
    totalRecentNotes: number;
  };
  noteTypes: Record<string, number>;
  attachmentTypes: Record<string, number>;
  statistics: {
    oldestNote: string | null;
    newestNote: string | null;
    lastModified: string | null;
    databaseSizeBytes: number | null;
  };
  timestamp: string;
}
```

#### Backup

`PUT /etapi/backup/{backupName}` - Create backup

#### OpenAPI Specification

`GET /etapi/etapi.openapi.yaml` - Get OpenAPI specification

- Rate limited: 100 requests per 15 minutes
- Returns YAML content type

## Data Models

### Core Entity Types

Based on the source code analysis, the main entity types are:

#### Note Types

Valid note types from `noteTypeService.getNoteTypeNames()`:

- `text` - Text notes
- `code` - Code notes
- `file` - File attachments
- `image` - Image notes
- `search` - Search notes
- `relationMap` - Relation maps
- `render` - Render notes
- `canvas` - Canvas notes
- `mermaid` - Mermaid diagrams
- `book` - Book notes
- `webView` - Web view notes
- `launcher` - Launcher notes
- `doc` - Document notes
- `contentWidget` - Content widgets
- `mindMap` - Mind maps
- `geoMap` - Geographic maps

#### Entity ID Format

All entity IDs follow the pattern: `/^[A-Za-z0-9_]{4,128}$/`

- Alphanumeric characters and underscores only
- 4 to 128 characters in length

#### Date Formats

- **Local DateTime**: Validated by `dateUtils.validateLocalDateTime()`
- **UTC DateTime**: Validated by `dateUtils.validateUtcDateTime()`
- Typically ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Validation System

The ETAPI uses a comprehensive validation system defined in `/etapi/validators.ts`:

```typescript
// Validation functions
function mandatory(obj: unknown): string | undefined;
function notNull(obj: unknown): string | undefined;
function isString(obj: unknown): string | undefined;
function isBoolean(obj: unknown): string | undefined;
function isInteger(obj: unknown): string | undefined;
function isNoteId(obj: unknown): string | undefined;
function isNoteType(obj: unknown): string | undefined;
function isAttributeType(obj: unknown): string | undefined;
function isValidEntityId(obj: unknown): string | undefined;
function isLocalDateTime(obj: unknown): string | undefined;
function isUtcDateTime(obj: unknown): string | undefined;
```

## Search Implementation

The search system is sophisticated and supports multiple query types:

### Search Query Syntax

Based on the search service implementation:

1. **Fulltext Search**: Basic keyword search

   - Example: `"towers tolkien"`
   - Searches note titles and content

2. **Exact Match**: Use double quotes

   - Example: `"Two Towers"`
   - Exact phrase matching

3. **Attribute Search**: Search by labels/relations

   - Example: `"towers #book"`
   - Combines fulltext with attribute matching

4. **Advanced Operators**: The search system supports lexical parsing with:
   - Parentheses for grouping
   - Boolean operators (AND, OR, NOT)
   - Attribute-specific searches

### Search Parameters

```typescript
interface SearchParams {
  fastSearch?: boolean; // Skip content search
  includeArchivedNotes?: boolean; // Include archived notes
  ancestorNoteId?: string; // Limit to subtree
  ancestorDepth?: string; // Depth constraints
  orderBy?: string; // Sort field
  orderDirection?: string; // Sort direction
  limit?: number; // Result limit
  debug?: boolean; // Debug information
}
```

### Search Context

The search implementation uses a `SearchContext` class that:

- Tracks highlighted tokens for UI
- Maintains debug information
- Handles error states
- Manages search scope and filters

## Calendar Integration

The ETAPI provides comprehensive calendar integration through special note types:

### Calendar Endpoints

1. **Inbox Notes**: Daily capture notes

   - `GET /etapi/inbox/{date}`
   - Format: YYYY-MM-DD

2. **Day Notes**: Individual day notes

   - `GET /etapi/calendar/days/{date}`
   - Format: YYYY-MM-DD

3. **Week Notes**: Weekly organizational notes

   - `GET /etapi/calendar/weeks/{week}`
   - Format: YYYY-W## (ISO week numbers)

4. **Month Notes**: Monthly overview notes

   - `GET /etapi/calendar/months/{month}`
   - Format: YYYY-MM

5. **Year Notes**: Annual summary notes
   - `GET /etapi/calendar/years/{year}`
   - Format: YYYY

### Implementation Details

Calendar notes are created automatically when requested:

- Uses `specialNotesService.getInboxNote(date)` for inbox notes
- Uses `dateNotesService` for calendar notes
- Notes are created if they don't exist
- Follows Trilium's date note structure and hierarchy

## Error Handling

### Error Response Format

All ETAPI errors follow a consistent format:

```typescript
interface ErrorResponse {
  status: number; // HTTP status code
  code: string; // Error code identifier
  message: string; // Human-readable error message
}
```

### Common Error Codes

Based on source code analysis:

- `NOT_AUTHENTICATED` (401): Invalid or missing authentication
- `WRONG_PASSWORD` (401): Incorrect password during login
- `NOTE_NOT_FOUND` (404): Requested note doesn't exist
- `ATTACHMENT_NOT_FOUND` (404): Requested attachment doesn't exist
- `BRANCH_NOT_FOUND` (404): Requested branch doesn't exist
- `ATTRIBUTE_NOT_FOUND` (404): Requested attribute doesn't exist
- `NOTE_IS_PROTECTED` (400): Cannot access protected note content
- `ATTACHMENT_IS_PROTECTED` (400): Cannot access protected attachment
- `PROPERTY_NOT_ALLOWED` (400): Property not allowed in request
- `PROPERTY_VALIDATION_ERROR` (400): Property validation failed
- `SEARCH_QUERY_PARAM_MANDATORY` (400): Missing required search parameter
- `GENERIC` (500): Generic server error

### Error Handling Implementation

The ETAPI uses a custom `EtapiError` class:

```typescript
class EtapiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

## Security Considerations

### Protected Content

- Protected notes cannot be read or modified via ETAPI
- Returns 400 error with `NOTE_IS_PROTECTED` code
- Applies to both note content and metadata operations

### Input Validation

- All input is validated using type-specific validators
- Entity IDs must match specific patterns
- Date fields are strictly validated
- Note types must be from predefined list

### Rate Limiting

- Authentication endpoints: 10 requests per 15 minutes per IP
- OpenAPI spec endpoint: 100 requests per 15 minutes per IP

### Token Security

- Tokens are SHA-256 hashed before storage
- Original tokens are never stored in database
- Tokens can be revoked by deletion
- Support for multiple concurrent tokens per instance

## Implementation Examples

### Python Client Example

```python
import requests
import json

class TriliumETAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def search_notes(self, query, **params):
        """Search for notes using ETAPI"""
        params['search'] = query
        response = requests.get(
            f'{self.base_url}/etapi/notes',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_note(self, note_id):
        """Get note by ID"""
        response = requests.get(
            f'{self.base_url}/etapi/notes/{note_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def create_note(self, parent_note_id, title, note_type='text', content=''):
        """Create a new note"""
        data = {
            'parentNoteId': parent_note_id,
            'title': title,
            'type': note_type,
            'content': content
        }
        response = requests.post(
            f'{self.base_url}/etapi/create-note',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

    def get_day_note(self, date):
        """Get calendar day note"""
        response = requests.get(
            f'{self.base_url}/etapi/calendar/days/{date}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage example
api = TriliumETAPI('http://localhost:37740', 'your_token_here')

# Search for notes
results = api.search_notes('project #important', limit=10)

# Create a note
new_note = api.create_note(
    parent_note_id='root',
    title='My New Note',
    note_type='text',
    content='This is my note content'
)

# Get today's day note
import datetime
today = datetime.date.today().isoformat()
day_note = api.get_day_note(today)
```

### JavaScript/Node.js Client Example

```javascript
const axios = require("axios");

class TriliumETAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async searchNotes(query, options = {}) {
    const params = { search: query, ...options };
    const response = await this.client.get("/etapi/notes", { params });
    return response.data;
  }

  async getNote(noteId) {
    const response = await this.client.get(`/etapi/notes/${noteId}`);
    return response.data;
  }

  async createNote(parentNoteId, title, type = "text", content = "") {
    const data = {
      parentNoteId,
      title,
      type,
      content,
    };
    const response = await this.client.post("/etapi/create-note", data);
    return response.data;
  }

  async updateNoteContent(noteId, content) {
    await this.client.put(`/etapi/notes/${noteId}/content`, content, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  async createAttribute(noteId, type, name, value = "") {
    const data = {
      noteId,
      type,
      name,
      value,
      attributeId: this.generateId(),
    };
    const response = await this.client.post("/etapi/attributes", data);
    return response.data;
  }

  generateId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

// Usage example
const api = new TriliumETAPI("http://localhost:37740", "your_token_here");

(async () => {
  try {
    // Search for notes
    const searchResults = await api.searchNotes("meeting #work");
    console.log("Found notes:", searchResults.results.length);

    // Create a new note
    const newNote = await api.createNote(
      "root",
      "Weekly Review",
      "text",
      "# Weekly Review\n\n## Accomplishments\n\n## Next Week Goals"
    );
    console.log("Created note:", newNote.note.noteId);

    // Add label to the note
    await api.createAttribute(newNote.note.noteId, "label", "review", "weekly");
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
  }
})();
```

### cURL Examples

```bash
# Get authentication token
curl -X POST http://localhost:37740/etapi/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password", "tokenName": "My API Client"}'

# Search for notes
curl -X GET "http://localhost:37740/etapi/notes?search=meeting%20%23work" \
  -H "Authorization: Bearer your_token_here"

# Create a new note
curl -X POST http://localhost:37740/etapi/create-note \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "parentNoteId": "root",
    "title": "API Test Note",
    "type": "text",
    "content": "This note was created via API"
  }'

# Get note content
curl -X GET http://localhost:37740/etapi/notes/your_note_id/content \
  -H "Authorization: Bearer your_token_here"

# Update note content
curl -X PUT http://localhost:37740/etapi/notes/your_note_id/content \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: text/plain" \
  -d "Updated note content"

# Get today's day note
curl -X GET http://localhost:37740/etapi/calendar/days/$(date +%Y-%m-%d) \
  -H "Authorization: Bearer your_token_here"

# Get metrics in JSON format
curl -X GET "http://localhost:37740/etapi/metrics?format=json" \
  -H "Authorization: Bearer your_token_here"
```

---

This technical reference is based on analysis of the Trilium Next source code and provides implementation-accurate details for ETAPI integration. For the most up-to-date information, always refer to the OpenAPI specification available at `/etapi/etapi.openapi.yaml` on your Trilium instance.
