# notion-mcp-server

English | [日本語](./README.ja.md)

MCP (Model Context Protocol) server for Notion API. Enables AI assistants to interact with Notion pages, databases, and blocks.

> ⚠️ **Note**: This is an early release. API may change.

## Features

- **Page Operations**: Create, retrieve, and update Notion pages
- **Database Queries**: Query databases with filters and sorts
- **Block Operations**: Get and append block children
- **Search**: Search across pages and databases
- **Comments**: Add comments to pages
- **Token-Efficient Output**: Markdown/simple format reduces token usage by ~96%

## Installation

```bash
npm install @atikk-co-jp/notion-mcp-server
# or
pnpm add @atikk-co-jp/notion-mcp-server
# or
yarn add @atikk-co-jp/notion-mcp-server
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@atikk-co-jp/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "your-notion-integration-token"
      }
    }
  }
}
```

### With Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@atikk-co-jp/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "your-notion-integration-token"
      }
    }
  }
}
```

## Getting a Notion Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name and select the workspace
4. Copy the "Internal Integration Token" (starts with `ntn_`)
5. Share the pages/databases you want to access with your integration

## Available Tools

### retrieve-page

Retrieve a Notion page by its ID.

**Parameters:**
- `page_id` (required): The ID of the page to retrieve
- `format` (optional): Output format - `"simple"` (default) or `"json"`
  - `simple`: Returns simplified property values with reduced token usage
  - `json`: Returns raw Notion API response

```json
{
  "page_id": "page-uuid-here",
  "format": "simple"
}
```

### create-page

Create a new page in a database.

```json
{
  "database_id": "database-uuid-here",
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "New Page Title" } }]
    },
    "Status": {
      "status": { "name": "In Progress" }
    }
  }
}
```

### update-page

Update a page's properties.

```json
{
  "page_id": "page-uuid-here",
  "properties": {
    "Status": {
      "status": { "name": "Done" }
    }
  }
}
```

### query-database

Query a database with optional filters and sorts.

**Parameters:**
- `database_id` (required): The ID of the database to query
- `filter` (optional): Filter conditions as a JSON object
- `sorts` (optional): Sort conditions as an array
- `start_cursor` (optional): Cursor for pagination
- `page_size` (optional): Number of results to return (1-100)
- `format` (optional): Output format - `"simple"` (default) or `"json"`
  - `simple`: Returns simplified property values with reduced token usage
  - `json`: Returns raw Notion API response

```json
{
  "database_id": "database-uuid-here",
  "filter": {
    "property": "Status",
    "status": { "equals": "In Progress" }
  },
  "sorts": [
    { "property": "Created", "direction": "descending" }
  ],
  "format": "simple"
}
```

### search

Search across all pages and databases.

```json
{
  "query": "search term",
  "filter": { "value": "page", "property": "object" }
}
```

### get-block-children

Get the child blocks of a page or block.

**Parameters:**
- `block_id` (required): The ID of the block or page to get children from
- `start_cursor` (optional): Cursor for pagination
- `page_size` (optional): Number of results to return (1-100)
- `format` (optional): Output format - `"markdown"` (default) or `"json"`
  - `markdown`: Returns human-readable markdown with significantly reduced token usage (~96% reduction)
  - `json`: Returns raw Notion API response
- `fetch_nested` (optional): When `format="markdown"`, fetch nested children blocks recursively (default: false)

```json
{
  "block_id": "page-or-block-uuid-here",
  "format": "markdown",
  "fetch_nested": true
}
```

### append-block-children

Append new blocks to a page or block.

```json
{
  "block_id": "page-or-block-uuid-here",
  "children": [
    {
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "text": { "content": "New paragraph" } }]
      }
    }
  ]
}
```

### create-comment

Add a comment to a page.

```json
{
  "page_id": "page-uuid-here",
  "rich_text": [{ "type": "text", "text": { "content": "This is a comment" } }]
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## License

MIT
