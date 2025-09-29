# Trilium ETAPI Technical Reference

This document provides comprehensive technical documentation for the Trilium External API (ETAPI) based on the actual source code implementation. It covers all endpoints, data structures, validation rules, and implementation details.

## Table of Contents
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Search Parameters](#search-parameters)
- [Validation Rules](#validation-rules)
- [Common Patterns](#common-patterns)

## Authentication

### Overview
ETAPI uses token-based authentication with rate limiting on login endpoints.

### Authentication Flow
1. **Login**: `POST /etapi/auth/login`
2. **Use Token**: Include in `Authorization` header
3. **Logout**: `POST /etapi/auth/logout`

### Endpoints

#### Login
```http
POST /etapi/auth/login
Content-Type: application/json

{
  "password": "your_trilium_password",
  "tokenName": "Optional token name" // defaults to "ETAPI login"
}
```

**Response (201)**:
```json
{
  "authToken": "etapi_token_string"
}
```

**Error (401)**:
```json
{
  "status": 401,
  "code": "WRONG_PASSWORD",
  "message": "Wrong password."
}
```

#### Logout
```http
POST /etapi/auth/logout
Authorization: your_token_here
```

**Response**: `204 No Content`

### Rate Limiting
- Login endpoints have rate limiting: 10 requests per 15 minutes per IP
- Successful authentications to other ETAPI routes don't count against the limit

### Token Usage
Include the token in the Authorization header for all authenticated requests:
```http
Authorization: your_etapi_token_here
```

## Error Handling

### Error Response Format
All errors follow a consistent format:
```json
{
  "status": 400,
  "code": "ERROR_CODE",
  "message": "Human readable error message"
}
```

### Common Error Codes
- `NOT_AUTHENTICATED` (401): Missing or invalid authentication
- `NOTE_NOT_FOUND` (404): Referenced note doesn't exist
- `BRANCH_NOT_FOUND` (404): Referenced branch doesn't exist
- `ATTACHMENT_NOT_FOUND` (404): Referenced attachment doesn't exist
- `ATTRIBUTE_NOT_FOUND` (404): Referenced attribute doesn't exist
- `NOTE_IS_PROTECTED` (400): Cannot modify protected note through ETAPI
- `ATTACHMENT_IS_PROTECTED` (400): Cannot modify protected attachment
- `PROPERTY_NOT_ALLOWED` (400): Invalid property for the operation
- `PROPERTY_VALIDATION_ERROR` (400): Property validation failed
- `SEARCH_QUERY_PARAM_MANDATORY` (400): Search query parameter required
- `GENERIC` (500): Generic server error

### Protected Content
Protected notes and attachments cannot be modified or have their content accessed through ETAPI for security reasons.

## Data Models

### Note Object
```typescript
interface Note {
  noteId: string;
  isProtected: boolean;
  title: string;
  type: string;  // text, code, file, image, search, etc.
  mime: string;
  blobId: string;
  dateCreated: string;       // local datetime
  dateModified: string;      // local datetime
  utcDateCreated: string;    // UTC datetime
  utcDateModified: string;   // UTC datetime
  parentNoteIds: string[];
  childNoteIds: string[];
  parentBranchIds: string[];
  childBranchIds: string[];
  attributes: Attribute[];
}
```

### Branch Object
```typescript
interface Branch {
  branchId: string;
  noteId: string;
  parentNoteId: string;
  prefix: string;
  notePosition: number;
  isExpanded: boolean;
  utcDateModified: string;
}
```

### Attribute Object
```typescript
interface Attribute {
  attributeId: string;
  noteId: string;
  type: "label" | "relation";
  name: string;
  value: string;
  position: number;
  isInheritable: boolean;
  utcDateModified: string;
}
```

### Attachment Object
```typescript
interface Attachment {
  attachmentId: string;
  ownerId: string;
  role: string;
  mime: string;
  title: string;
  position: number;
  blobId: string;
  dateModified: string;
  utcDateModified: string;
  utcDateScheduledForErasureSince: string | null;
  contentLength: number;
}
```

## API Endpoints

### Notes

#### Search Notes
```http
GET /etapi/notes?search=query&[searchParams]
```

**Required Parameters**:
- `search`: Search query string (mandatory)

**Optional Search Parameters**:
- `fastSearch`: boolean ("true"/"false")
- `includeArchivedNotes`: boolean
- `ancestorNoteId`: string
- `ancestorDepth`: string (e.g., "eq5")
- `orderBy`: string
- `orderDirection`: "asc" | "desc"
- `limit`: number
- `debug`: boolean

**Response**:
```json
{
  "results": [/* array of Note objects */],
  "debugInfo": { /* debug info if debug=true */ }
}
```

#### Get Note
```http
GET /etapi/notes/{noteId}
```

**Response**: Note object

#### Create Note
```http
POST /etapi/create-note
Content-Type: application/json

{
  "parentNoteId": "required_parent_note_id",
  "title": "Required note title",
  "type": "text", // required: text, code, file, etc.
  "mime": "text/html", // optional
  "content": "Note content", // optional
  "notePosition": 100, // optional
  "prefix": "Optional prefix", // optional
  "isExpanded": true, // optional
  "noteId": "custom_note_id", // optional, auto-generated if not provided
  "dateCreated": "2023-01-01 12:00:00.000", // optional local datetime
  "utcDateCreated": "2023-01-01 12:00:00.000Z" // optional UTC datetime
}
```

**Response (201)**:
```json
{
  "note": { /* Note object */ },
  "branch": { /* Branch object */ }
}
```

#### Update Note
```http
PATCH /etapi/notes/{noteId}
Content-Type: application/json

{
  "title": "Updated title", // optional
  "type": "text", // optional
  "mime": "text/html", // optional
  "dateCreated": "2023-01-01 12:00:00.000", // optional
  "utcDateCreated": "2023-01-01 12:00:00.000Z" // optional
}
```

**Response**: Updated Note object

#### Delete Note
```http
DELETE /etapi/notes/{noteId}
```

**Response**: `204 No Content`

#### Get Note Content
```http
GET /etapi/notes/{noteId}/content
```

**Response**: Raw note content with appropriate Content-Type header

#### Update Note Content
```http
PUT /etapi/notes/{noteId}/content
Content-Type: [appropriate mime type]

[Raw content data]
```

**Response**: `204 No Content`

#### Export Note
```http
GET /etapi/notes/{noteId}/export?format=html
```

**Parameters**:
- `format`: "html" (default) | "markdown"

**Response**: ZIP file download

#### Import to Note
```http
POST /etapi/notes/{noteId}/import
Content-Type: application/octet-stream

[ZIP file data]
```

**Response (201)**:
```json
{
  "note": { /* imported Note object */ },
  "branch": { /* Branch object */ }
}
```

#### Create Note Revision
```http
POST /etapi/notes/{noteId}/revision
```

**Response**: `204 No Content`

#### Get Note Attachments
```http
GET /etapi/notes/{noteId}/attachments
```

**Response**: Array of Attachment objects

### Branches

#### Get Branch
```http
GET /etapi/branches/{branchId}
```

**Response**: Branch object

#### Create Branch
```http
POST /etapi/branches
Content-Type: application/json

{
  "noteId": "required_note_id",
  "parentNoteId": "required_parent_note_id",
  "notePosition": 100, // optional
  "prefix": "Optional prefix", // optional
  "isExpanded": true // optional
}
```

**Response (201 or 200)**: Branch object
- 201 if new branch created
- 200 if existing branch updated

#### Update Branch
```http
PATCH /etapi/branches/{branchId}
Content-Type: application/json

{
  "notePosition": 100, // optional
  "prefix": "Updated prefix", // optional
  "isExpanded": false // optional
}
```

**Response**: Updated Branch object

#### Delete Branch
```http
DELETE /etapi/branches/{branchId}
```

**Response**: `204 No Content`

#### Refresh Note Ordering
```http
POST /etapi/refresh-note-ordering/{parentNoteId}
```

**Response**: `204 No Content`

### Attributes

#### Get Attribute
```http
GET /etapi/attributes/{attributeId}
```

**Response**: Attribute object

#### Create Attribute
```http
POST /etapi/attributes
Content-Type: application/json

{
  "attributeId": "custom_attribute_id", // required
  "noteId": "required_note_id",
  "type": "label", // required: "label" | "relation"
  "name": "attribute_name", // required
  "value": "attribute_value", // optional for labels, note ID for relations
  "isInheritable": true, // optional
  "position": 100 // optional
}
```

**Response (201)**: Attribute object

**Note**: For relation attributes, the `value` must be a valid note ID.

#### Update Attribute
```http
PATCH /etapi/attributes/{attributeId}
Content-Type: application/json

// For labels:
{
  "value": "new_value", // optional
  "position": 200 // optional
}

// For relations:
{
  "position": 200 // optional - value changes require deletion and recreation
}
```

**Response**: Updated Attribute object

#### Delete Attribute
```http
DELETE /etapi/attributes/{attributeId}
```

**Response**: `204 No Content`

### Attachments

#### Create Attachment
```http
POST /etapi/attachments
Content-Type: application/json

{
  "ownerId": "required_note_id", // note that owns this attachment
  "role": "file", // required
  "mime": "application/pdf", // required
  "title": "document.pdf", // required
  "position": 100, // optional
  "content": "base64_encoded_content" // optional
}
```

**Response (201)**: Attachment object

#### Get Attachment
```http
GET /etapi/attachments/{attachmentId}
```

**Response**: Attachment object

#### Update Attachment
```http
PATCH /etapi/attachments/{attachmentId}
Content-Type: application/json

{
  "role": "updated_role", // optional
  "mime": "updated/mime", // optional
  "title": "updated_title.ext", // optional
  "position": 200 // optional
}
```

**Response**: Updated Attachment object

#### Get Attachment Content
```http
GET /etapi/attachments/{attachmentId}/content
```

**Response**: Raw attachment content with appropriate headers

#### Update Attachment Content
```http
PUT /etapi/attachments/{attachmentId}/content
Content-Type: [appropriate mime type]

[Raw content data]
```

**Response**: `204 No Content`

#### Delete Attachment
```http
DELETE /etapi/attachments/{attachmentId}
```

**Response**: `204 No Content`

### Special Notes (Calendar/Date Notes)

#### Get Inbox Note
```http
GET /etapi/inbox/{date}
```

**Parameters**:
- `date`: YYYY-MM-DD format

**Response**: Note object

#### Get Day Note
```http
GET /etapi/calendar/days/{date}
```

**Parameters**:
- `date`: YYYY-MM-DD format

**Response**: Note object

#### Get Week First Day Note
```http
GET /etapi/calendar/week-first-day/{date}
```

**Parameters**:
- `date`: YYYY-MM-DD format (any day in the week)

**Response**: Note object

#### Get Week Note
```http
GET /etapi/calendar/weeks/{week}
```

**Parameters**:
- `week`: YYYY-WNN format (e.g., "2023-W15")

**Response**: Note object

**Error**: Returns 404 if week notes are not enabled

#### Get Month Note
```http
GET /etapi/calendar/months/{month}
```

**Parameters**:
- `month`: YYYY-MM format

**Response**: Note object

#### Get Year Note
```http
GET /etapi/calendar/years/{year}
```

**Parameters**:
- `year`: YYYY format

**Response**: Note object

### Application Info

#### Get Application Info
```http
GET /etapi/app-info
```

**Response**: Application information object with version details

### Backup

#### Create Backup
```http
PUT /etapi/backup/{backupName}
```

**Parameters**:
- `backupName`: Name for the backup file

**Response**: `204 No Content` on success, `500 Internal Server Error` on failure

### Metrics

#### Get Metrics
```http
GET /etapi/metrics?format=prometheus
```

**Parameters**:
- `format`: "prometheus" (default) | "json"

**Response**:
- Prometheus format: Plain text metrics
- JSON format: Structured metrics object

**Metrics Include**:
- Version information
- Database statistics (notes, attachments, revisions, etc.)
- Note type breakdowns
- Attachment type breakdowns
- Database size and timestamps

## Search Parameters

### Query Parameters for Note Search

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | **Required** search query | `search=todo` |
| `fastSearch` | boolean | Use fast search mode | `fastSearch=true` |
| `includeArchivedNotes` | boolean | Include archived notes | `includeArchivedNotes=true` |
| `ancestorNoteId` | string | Limit search to descendants of note | `ancestorNoteId=abc123` |
| `ancestorDepth` | string | Depth constraint for ancestor search | `ancestorDepth=eq5` |
| `orderBy` | string | Field to order results by | `orderBy=title` |
| `orderDirection` | string | Sort direction | `orderDirection=asc` |
| `limit` | number | Maximum number of results | `limit=50` |
| `debug` | boolean | Include debug information | `debug=true` |

### Search Query Syntax
The search functionality supports Trilium's full-text search syntax:
- Simple text search: `search=hello world`
- Note type filtering: `search=#book`
- Attribute filtering: `search=@author = "John Doe"`
- Complex queries: `search=note.title = "Important" AND #task`

## Validation Rules

### Field Validators

The ETAPI implements comprehensive validation using a validator system:

#### Basic Validators
- `mandatory`: Field must be present
- `notNull`: Field cannot be null
- `isString`: Must be a string
- `isBoolean`: Must be boolean
- `isInteger`: Must be an integer

#### Trilium-Specific Validators
- `isNoteId`: Must be a valid existing note ID
- `isNoteType`: Must be a valid note type (text, code, file, image, search, etc.)
- `isAttributeType`: Must be "label" or "relation"
- `isValidEntityId`: Must match pattern `^[A-Za-z0-9_]{4,128}$`
- `isLocalDateTime`: Must be valid local datetime format
- `isUtcDateTime`: Must be valid UTC datetime format

### Note Creation Validation
```typescript
{
  parentNoteId: [mandatory, notNull, isNoteId],
  title: [mandatory, notNull, isString],
  type: [mandatory, notNull, isNoteType],
  mime: [notNull, isString],
  content: [notNull, isString],
  notePosition: [notNull, isInteger],
  prefix: [notNull, isString],
  isExpanded: [notNull, isBoolean],
  noteId: [notNull, isValidEntityId],
  dateCreated: [notNull, isString, isLocalDateTime],
  utcDateCreated: [notNull, isString, isUtcDateTime]
}
```

### Note Update Validation
```typescript
{
  title: [notNull, isString],
  type: [notNull, isString],
  mime: [notNull, isString],
  dateCreated: [notNull, isString, isLocalDateTime],
  utcDateCreated: [notNull, isString, isUtcDateTime]
}
```

### Branch Creation Validation
```typescript
{
  noteId: [mandatory, notNull, isNoteId],
  parentNoteId: [mandatory, notNull, isNoteId],
  notePosition: [notNull, isInteger],
  prefix: [isString],
  isExpanded: [notNull, isBoolean]
}
```

### Attribute Creation Validation
```typescript
{
  attributeId: [mandatory, notNull, isValidEntityId],
  noteId: [mandatory, notNull, isNoteId],
  type: [mandatory, notNull, isAttributeType],
  name: [mandatory, notNull, isString],
  value: [notNull, isString],
  isInheritable: [notNull, isBoolean],
  position: [notNull, isInteger]
}
```

### Attachment Creation Validation
```typescript
{
  ownerId: [notNull, isNoteId],
  role: [notNull, isString],
  mime: [notNull, isString],
  title: [notNull, isString],
  position: [notNull, isInteger],
  content: [isString]
}
```

## Common Patterns

### Request/Response Flow
1. All requests require authentication (except login)
2. Requests are processed within database transactions
3. Validation occurs before any database operations
4. Consistent error response format
5. Protected content checks for sensitive operations

### Entity Relationships
- Notes can have multiple parent branches (cloning)
- Branches define parent-child relationships
- Attributes can be labels or relations
- Attachments belong to notes
- All entities have modification timestamps

### Content Handling
- Note content is stored separately from metadata
- Binary content is handled through blob storage
- Content-Type headers are set appropriately
- Content-Disposition headers enable file downloads

### Transactional Safety
- All operations are wrapped in database transactions
- Failed operations are automatically rolled back
- Entity changes are tracked for synchronization

### Performance Considerations
- Fast search mode available for better performance
- Search results can be limited
- Ancestor-based search scoping supported
- Metrics endpoint provides monitoring data

## Implementation Notes

### Security Features
- Rate limiting on authentication endpoints
- Protected note/attachment content cannot be accessed
- Token-based authentication with logout support
- Input validation on all endpoints

### Error Recovery
- Graceful handling of missing entities (404 responses)
- Validation errors provide detailed feedback
- Generic errors for unexpected conditions
- Consistent error response structure

### Extensibility
- Modular route registration system
- Configurable authentication (can be disabled)
- Pluggable validation system
- Metrics collection for monitoring

### Synchronization Support
- Entity change tracking
- UTC timestamps for sync coordination
- Transaction-based consistency
- Revision management for notes

This documentation reflects the actual implementation in the Trilium ETAPI source code and provides developers with accurate, comprehensive information for building applications that interact with Trilium's External API.