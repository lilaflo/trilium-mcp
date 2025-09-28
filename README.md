# Trilium MCP Server

A Model Context Protocol (MCP) server for integrating with [Trilium Notes](https://github.com/TriliumNext/Trilium), providing seamless access to note management functionality through MCP-compatible clients.

## Features

- **Note Management**: Create, update, and search notes in your Trilium instance
- **Advanced Search**: Comprehensive search functionality with filtering options
- **Secure Authentication**: Environment-based token authentication
- **RESTful API**: HTTP-based MCP server with health checks
- **Docker Support**: Ready for containerized deployment

## Available Tools

### `create_note`
Create a new note under a specified parent note.

**Parameters:**
- `parentId` (string): ID of the parent note
- `title` (string): Title of the new note
- `content` (string, optional): Content of the new note
- `type` (string, default: "text"): Type of note (text, code, book, etc.)

### `find_notes`
Simple fulltext search across all notes.

**Parameters:**
- `q` (string): Search query to find notes

### `search_note`
Advanced search with multiple criteria and filtering options.

**Parameters:**
- `query` (string): Main search query text
- `searchIn` (enum: "title" | "content" | "both", default: "both"): Where to search
- `limit` (number, 1-100, default: 20): Maximum number of results
- `includeArchived` (boolean, default: false): Include archived notes
- `noteType` (string, optional): Filter by note type

### `update_note`
Update an existing note's title or content.

**Parameters:**
- `id` (string): ID of the note to update
- `title` (string, optional): New title for the note
- `content` (string, optional): New content for the note

## Setup

### Prerequisites

- Node.js 18 or higher
- A running Trilium Notes instance
- Trilium ETAPI token

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trilium-mcp
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
TRILIUM_URL=https://your-trilium-instance.com/etapi
TRILIUM_TOKEN=your-etapi-token-here
PORT=3000
```

### Getting Your Trilium ETAPI Token

1. Open your Trilium Notes instance
2. Go to Options → ETAPI
3. Create a new token or use an existing one
4. Copy the token to your `.env` file

## Usage

### Development

Start the server in development mode with auto-reload:
```bash
pnpm dev
```

### Production

Start the server:
```bash
pnpm start
```

The server will be available at `http://localhost:3000/mcp`

### Health Check

Check if the server is running:
```bash
curl http://localhost:3000/health
```

## Docker Deployment

### Build and Run Locally

```bash
docker build -t trilium-mcp .
docker run -p 3000:3000 \
  -e TRILIUM_URL=https://your-trilium-instance.com/etapi \
  -e TRILIUM_TOKEN=your-token \
  trilium-mcp
```

### Fly.io Deployment

This project includes configuration for deployment on Fly.io:

1. Install the Fly CLI
2. Set your secrets:
```bash
fly secrets set TRILIUM_URL=https://your-trilium-instance.com/etapi
fly secrets set TRILIUM_TOKEN=your-token
```
3. Deploy:
```bash
fly deploy
```

## API Usage

### MCP Client Connection

Connect to the server using any MCP-compatible client:

```javascript
const client = new MCPClient({
  transport: new HTTPTransport("http://localhost:3000/mcp")
});
```

### Example Requests

Create a note:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_note",
    "arguments": {
      "parentId": "root",
      "title": "My New Note",
      "content": "This is the content of my note"
    }
  }
}
```

Search notes:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_note",
    "arguments": {
      "query": "project ideas",
      "searchIn": "both",
      "limit": 10,
      "includeArchived": false
    }
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TRILIUM_URL` | Base URL of your Trilium instance with `/etapi` path | Yes | - |
| `TRILIUM_TOKEN` | ETAPI authentication token | Yes | - |
| `PORT` | Port for the HTTP server | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |

### Security Considerations

- Never commit your `.env` file to version control
- Use environment variables for production deployments
- Ensure your Trilium instance is properly secured
- Consider using HTTPS for production deployments

## Troubleshooting

### Common Issues

**Server fails to start with "TRILIUM_TOKEN and TRILIUM_URL environment variables are required"**
- Ensure both environment variables are set in your `.env` file
- Check that the `.env` file is in the project root directory

**ETAPI requests fail with authentication errors**
- Verify your ETAPI token is correct
- Ensure your Trilium instance is accessible from the server
- Check that the ETAPI is enabled in your Trilium instance

**Search returns no results**
- Verify your Trilium instance has searchable content
- Check the search syntax in the Trilium documentation
- Try using the simpler `find_notes` tool first

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Links

- [Trilium Notes](https://github.com/TriliumNext/Trilium)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Trilium ETAPI Documentation](https://github.com/TriliumNext/Trilium/wiki/ETAPI)