# notion-mcp-server

English | [日本語](./README.ja.md)

MCP (Model Context Protocol) server for Notion API. Enables AI assistants to interact with Notion pages, databases, and blocks.

**API Version**: 2025-09-03 (latest)

## Why this repository?

### Why I Built This

I wanted to use AI agents to process tasks from my Notion database with specific conditions:

> "Get tasks where Status = 'Not Started' AND Assignee = 'Alice', sorted by Priority"

Here's what I found with existing options:

| MCP Option | Property Filtering | Token Efficiency | Plan Required |
|------------|-------------------|------------------|---------------|
| [Official Notion MCP](https://developers.notion.com/docs/mcp) | Metadata only (created_at, created_by) / Full (Enterprise+AI) | Good | Notion AI |
| [`@notionhq/notion-mcp-server`](https://github.com/makenotion/notion-mcp-server) | ✅ Full support | Large responses | None |
| **This repository** | ✅ Full support | **Optimized** | **None** |

**The gap I wanted to fill:**
- Full database property filtering (AND/OR, select, checkbox, date, etc.)
- Optimized response sizes for LLM token efficiency
- No plan restrictions

**This repository provides property filtering with `fields` parameter for 90% token reduction.**

## Features

- **Page Operations**: Create, retrieve, update, and move Notion pages
- **Database Operations**: Create, retrieve, update, and query databases with filters and sorts
- **Block Operations**: Retrieve, update, delete, and append blocks
- **Search**: Search across pages and databases
- **Comments**: Create and list comments
- **Users**: List users and retrieve user info
- **Token-Efficient Output**: Markdown/simple format reduces token usage by ~96%
- **Markdown Input**: Create and append content using Markdown (80% fewer input tokens)

## API Coverage

> ⭐ = Markdown input supported (reduces input tokens by ~80%)
>
> 📤 = Minimal response (id/url only) - reduces output tokens by ~90%

| Category | Notion API | MCP Tool | Input | Output (default) |
|----------|-----------|----------|-------|------------------|
| **Pages** | | | | |
| | [Create page](https://developers.notion.com/reference/post-page) | `create-page` 📤 | JSON | `{id, url}` |
| | | `create-page-simple` ⭐📤 | Markdown | `{id, url}` |
| | [Retrieve page](https://developers.notion.com/reference/retrieve-a-page) | `retrieve-page` | JSON | **simple**/json |
| | [Update page](https://developers.notion.com/reference/patch-page) | `update-page` 📤 | JSON | `{id, url}` |
| | [Retrieve page property](https://developers.notion.com/reference/retrieve-a-page-property-item) | `retrieve-page-property` | JSON | json |
| | [Move page](https://developers.notion.com/reference/post-page-move) | `move-page` 📤 | JSON | `{id, url}` |
| | [Archive page](https://developers.notion.com/reference/patch-page) | `archive-page` 📤 | JSON | `{id}` |
| **Databases** | | | | |
| | [Create database](https://developers.notion.com/reference/create-a-database) | `create-database` 📤 | JSON | `{id, url}` |
| | [Retrieve database](https://developers.notion.com/reference/retrieve-a-database) | `retrieve-database` | JSON | **simple**/json |
| | [Update database](https://developers.notion.com/reference/update-a-database) | `update-database` 📤 | JSON | `{id, url}` |
| | [Archive database](https://developers.notion.com/reference/update-a-database) | `archive-database` 📤 | JSON | `{id}` |
| **Data Sources** | | | | |
| | [Retrieve data source](https://developers.notion.com/reference/retrieve-a-data-source) | `retrieve-data-source` | JSON | **simple**/json |
| | [Query data source](https://developers.notion.com/reference/post-data-source-query) | `query-data-source` | JSON | **simple**/json |
| | [Update data source](https://developers.notion.com/reference/patch-data-source) | `update-data-source` 📤 | JSON | `{id}` |
| **Blocks** | | | | |
| | [Retrieve block](https://developers.notion.com/reference/retrieve-a-block) | `retrieve-block` | JSON | **markdown**/json |
| | [Update block](https://developers.notion.com/reference/update-a-block) | `update-block` 📤 | JSON | `{id}` |
| | | `update-block-simple` ⭐📤 | Markdown | `{id}` |
| | [Delete block](https://developers.notion.com/reference/delete-a-block) | `delete-block` 📤 | JSON | `{id}` |
| | [Retrieve block children](https://developers.notion.com/reference/get-block-children) | `get-block-children` | JSON | **markdown**/json |
| | [Append block children](https://developers.notion.com/reference/patch-block-children) | `append-block-children` 📤 | JSON | `{block_ids}` |
| | | `append-blocks-simple` ⭐📤 | Markdown | `{block_ids}` |
| | | `replace-page-content` ⭐📤 | Markdown | `{deleted_count, created_count}` |
| | | `find-and-replace-in-page` ⭐📤 | Markdown | `{updated_count, updated_block_ids}` |
| **Comments** | | | | |
| | [Create comment](https://developers.notion.com/reference/create-a-comment) | `create-comment` 📤 | JSON | `{id}` |
| | | `create-comment-simple` ⭐📤 | Markdown | `{id}` |
| | [List comments](https://developers.notion.com/reference/retrieve-comments) | `list-comments` | JSON | json |
| **Users** | | | | |
| | [List users](https://developers.notion.com/reference/get-users) | `list-users` | JSON | json |
| | [Retrieve user](https://developers.notion.com/reference/get-user) | `retrieve-user` | JSON | json |
| | [Retrieve bot user](https://developers.notion.com/reference/get-self) | `retrieve-bot-user` | JSON | json |
| **Search** | | | | |
| | [Search](https://developers.notion.com/reference/post-search) | `search` | JSON | **simple**/json |

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
- `include_content` (optional): Include page content as markdown (default: true)

```json
{
  "page_id": "page-uuid-here",
  "format": "simple",
  "include_content": true
}
```

### create-page

Create a new page in a data source.

```json
{
  "data_source_id": "data-source-uuid-here",
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

### create-page-simple ⭐

Create a new page using Markdown. **~80% fewer output tokens** compared to `create-page`.

**Parameters:**
- `data_source_id` (required): The data source ID to create the page in
- `title` (required): Page title as a simple string
- `content` (optional): Page content in Markdown
- `properties` (optional): Additional Notion properties
- `icon` (optional): Emoji icon (e.g., "🐛")

**Supported Markdown:**
- Headings: `# ## ###` (#### and beyond → heading_3)
- Lists: `- ` or `* ` (bulleted), `1. ` (numbered)
- Checkboxes: `- [ ]` / `- [x]`
- Code blocks: ` ``` ` with language
- Quotes: `> `
- Dividers: `---`
- Images: `![alt](url)`
- Tables: `| col1 | col2 |` with header separator `|---|---|`
- Inline: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, `[link](url)`

```json
{
  "data_source_id": "data-source-uuid-here",
  "title": "Bug Report",
  "content": "## Steps to Reproduce\n\n1. Login\n2. Open settings\n\n## Expected Behavior\n\nShould display correctly",
  "properties": {
    "Status": { "status": { "name": "Open" } }
  },
  "icon": "🐛"
}
```

**Token Comparison:**
| Method | Tokens | Reduction |
|--------|--------|-----------|
| create-page (blocks) | ~152 | - |
| create-page-simple (markdown) | ~26 | **83%** |

### update-page

Update a page's properties, icon, cover, archive status, or lock status.

**Parameters:**
- `page_id` (required): The ID of the page to update
- `properties` (optional): Properties to update
- `icon` (optional): Icon (set to null to remove)
- `cover` (optional): Cover image (set to null to remove)
- `archived` (optional): Set to true to archive
- `is_locked` (optional): Lock the page to prevent edits in the UI

```json
{
  "page_id": "page-uuid-here",
  "properties": {
    "Status": {
      "status": { "name": "Done" }
    }
  },
  "is_locked": true
}
```

### query-data-source

Query a data source with optional filters and sorts.

**Parameters:**
- `data_source_id` (required): The ID of the data source to query
- `filter` (optional): Filter conditions as a JSON object
- `sorts` (optional): Sort conditions as an array
- `start_cursor` (optional): Cursor for pagination
- `page_size` (optional): Number of results to return (1-100)
- `format` (optional): Output format - `"simple"` (default) or `"json"`
  - `simple`: Returns simplified property values with reduced token usage
  - `json`: Returns raw Notion API response

```json
{
  "data_source_id": "data-source-uuid-here",
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

Update an existing database container (title, description, icon, cover).

**Note:** For schema (properties/columns) updates, use `update-data-source` instead.

**Parameters:**
- `database_id` (required): The ID of the database to update
- `title` (optional): New title as rich text array
- `description` (optional): New description as rich text array
- `icon` (optional): Icon (set to null to remove)
- `cover` (optional): Cover image (set to null to remove)
- `is_inline` (optional): If true, creates an inline database
- `archived` (optional): Set to true to archive
- `is_locked` (optional): Lock the database to prevent edits in the UI

```json
{
  "database_id": "database-uuid-here",
  "title": [{ "type": "text", "text": { "content": "New Title" } }],
  "is_locked": true
}
```

### retrieve-data-source

Retrieve a data source schema by its ID.

**Parameters:**
- `data_source_id` (required): The ID of the data source
- `format` (optional): Output format - `"simple"` (default) or `"json"`

```json
{
  "data_source_id": "data-source-uuid-here",
  "format": "simple"
}
```

### update-data-source

Update a data source schema (properties/columns).

**Parameters:**
- `data_source_id` (required): The ID of the data source to update
- `properties` (optional): Properties to add, update, or delete (set to null)

```json
{
  "data_source_id": "data-source-uuid-here",
  "properties": {
    "NewColumn": { "rich_text": {} },
    "OldColumn": null
  }
}
```

### search

Search across all pages and data sources.

```json
{
  "query": "search term",
  "filter": { "value": "page", "property": "object" }
}
```

**Filter values:** `"page"` or `"data_source"`

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

### append-blocks-simple ⭐

Append blocks using Markdown. **~80% fewer output tokens** compared to `append-block-children`.

**Parameters:**
- `block_id` (required): The page or block ID to append to
- `content` (required): Content in Markdown
- `after` (optional): Insert after this block ID

Same Markdown support as `create-page-simple`.

```json
{
  "block_id": "page-or-block-uuid-here",
  "content": "# New Section\n\nThis is **important** content with a [link](https://example.com).\n\n- Item 1\n- Item 2\n\n```javascript\nconst x = 1;\n```"
}
```

**Token Comparison:**
| Method | Tokens | Reduction |
|--------|--------|-----------|
| append-block-children (blocks) | ~201 | - |
| append-blocks-simple (markdown) | ~42 | **79%** |

### replace-page-content ⭐

Replace all content of a page with new Markdown content. Automatically preserves `child_database` and `child_page` blocks.

**Parameters:**
- `page_id` (required): The page ID to update
- `content` (required): New content in Markdown
- `dry_run` (optional): Preview which blocks will be deleted without making changes (default: false)

**⚠️ Warning:** Blocks not supported by Markdown (bookmark, callout, equation, table_of_contents, synced_block, etc.) will be **DELETED**. Use `dry_run: true` to preview before executing.

**Use when:** You want to completely rewrite page content without finding individual block IDs.

Same Markdown support as `create-page-simple`.

```json
{
  "page_id": "page-uuid-here",
  "content": "# New Page Title\n\nThis is the new content.\n\n## Section 1\n\n- Item 1\n- Item 2"
}
```

**Preview deletions (dry run):**
```json
{
  "page_id": "page-uuid-here",
  "content": "# New content",
  "dry_run": true
}
```

### find-and-replace-in-page ⭐

Find text in a page and replace it with new content. Supports regex patterns for advanced matching.

**Parameters:**
- `page_id` (required): The page ID to search in
- `find` (required): Text to find (string or regex pattern)
- `replace` (required): Replacement text (supports Markdown: `**bold**`, `*italic*`, etc.)
- `use_regex` (optional): If true, treat `find` as a regex pattern (default: false)

**Use when:** You want to update specific text without rewriting the entire page.

```json
{
  "page_id": "page-uuid-here",
  "find": "old text",
  "replace": "**new text**"
}
```

**With regex:**
```json
{
  "page_id": "page-uuid-here",
  "find": "item\\d+",
  "replace": "updated item",
  "use_regex": true
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

### create-comment-simple ⭐

Add a comment using Markdown. Simpler than `create-comment`.

**Parameters:**
- `page_id` (required): The ID of the page
- `content` (required): Comment in Markdown
- `discussion_id` (optional): Reply to existing thread

```json
{
  "page_id": "page-uuid-here",
  "content": "This is **important** with a [link](https://example.com)"
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
