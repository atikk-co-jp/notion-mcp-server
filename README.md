# notion-mcp-server

English | [日本語](./README.ja.md)

MCP (Model Context Protocol) server for Notion API. Enables AI assistants to interact with Notion pages, databases, and blocks.

> ⚠️ **Note**: This is an early release. API may change.

## Features

- **Page Operations**: Create, retrieve, and update Notion pages
- **Database Operations**: Create, update, and query databases with filters and sorts
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
      "args": ["-y", "atikk-notion-mcp-server"],
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
      "args": ["-y", "atikk-notion-mcp-server"],
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
- `include_content` (optional): Include page content as markdown (default: true)

```json
{
  "page_id": "page-uuid-here",
  "format": "simple",
  "include_content": true
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

### create-database

Create a new database as a subpage of an existing page.

**Parameters:**
- `parent_page_id` (required): The ID of the parent page
- `properties` (required): Database schema with at least one title property
- `title` (optional): Database title as rich text array
- `icon` (optional): Icon for the database
- `cover` (optional): Cover image for the database
- `is_inline` (optional): If true, creates an inline database

```json
{
  "parent_page_id": "parent-page-uuid",
  "properties": {
    "Name": { "title": {} },
    "Status": { "select": { "options": [{ "name": "Todo" }, { "name": "Done" }] } },
    "Priority": { "number": {} }
  },
  "title": [{ "type": "text", "text": { "content": "Task Database" } }]
}
```

### update-database

Update an existing database's properties, title, or schema.

**Parameters:**
- `database_id` (required): The ID of the database to update
- `title` (optional): New title as rich text array
- `description` (optional): New description as rich text array
- `properties` (optional): Properties to add, update, or delete (set to null)
- `icon` (optional): Icon (set to null to remove)
- `cover` (optional): Cover image (set to null to remove)
- `archived` (optional): Set to true to archive

```json
{
  "database_id": "database-uuid-here",
  "properties": {
    "NewColumn": { "rich_text": {} },
    "OldColumn": null
  }
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

# Lint
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## License

MIT
