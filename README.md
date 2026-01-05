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

## Installation

```bash
npm install notion-mcp-server
# or
pnpm add notion-mcp-server
# or
yarn add notion-mcp-server
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["notion-mcp-server"],
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
      "args": ["notion-mcp-server"],
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

```json
{
  "page_id": "page-uuid-here"
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

```json
{
  "database_id": "database-uuid-here",
  "filter": {
    "property": "Status",
    "status": { "equals": "In Progress" }
  },
  "sorts": [
    { "property": "Created", "direction": "descending" }
  ]
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

```json
{
  "block_id": "page-or-block-uuid-here"
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
```

## License

MIT
