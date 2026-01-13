# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2026-01-14

### Added

- **Child Page Creation**: `create-page` and `create-page-simple` now support creating child pages under an existing page
  - New `parent.page_id` parameter to specify parent page
  - Use either `parent.page_id` (for child pages) or `parent.data_source_id` (for database entries)
  - For page parent, title property name defaults to `title`; for data source parent, auto-detects from schema

## [0.11.0] - 2026-01-12

### Added

- **Bidirectional Extended Markdown Support**: Full support for extended markdown syntax in both directions
  - **Markdown → Notion**: `create-page-simple`, `append-blocks-simple` now support extended syntax
  - **Notion → Markdown**: `retrieve-page`, `get-block-children` now output extended syntax
- **Extended Markdown Syntax**: New block types and inline formatting
  - Toggle: `<details><summary>title</summary>content</details>`
  - Callout: `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!CAUTION]`
  - Equation: `$$E = mc^2$$` (block), `$inline$` (inline)
  - Underline: `<u>text</u>` or `++text++`
  - Color: `{color:red}text{/color}`, `{bg:yellow}text{/bg}`
  - Bookmark: `[bookmark](url)` or `[bookmark:caption](url)`
  - Columns: `:::columns` / `:::column` / `:::`
  - Media embeds: `@[embed](url)`, `@[video](url)`, `@[audio](url)`, `@[file](url)`, `@[pdf](url)`

### Improved

- **Test Coverage**: Added comprehensive tests for all extended markdown conversions (411 tests total)
- **Documentation**: Added Extended Markdown section to README with syntax examples

## [0.10.2] - 2026-01-12

### Changed

- **README Quick Start Optimization**: Reorganized README for users who want to get started quickly
  - Removed "Installation" section (unnecessary for MCP users who use `npx`)
  - Renamed "Usage" section to "Quick Start"
  - Integrated token acquisition steps into Quick Start (Step 1)
  - Integrated configuration steps into Quick Start (Step 2)
  - Changed token placeholder to `ntn_xxxxxxxxxxxx` for clarity

## [0.10.1] - 2026-01-12

### Added

- **README "Why this repository?" Section**: Added explanation of why this repository was created
  - Comparison table with Official Notion MCP and open-source version
  - Plan restrictions explained (Notion AI, Enterprise+AI)
  - Token efficiency comparison

### Changed

- **.gitignore**: Added `tmp/` to ignore temporary files

## [0.10.0] - 2026-01-11

### Added

- **Page Content Replacement Tools**: New tools for easier page content management
  - `replace-page-content`: Replace all content of a page with Markdown (preserves child_database/child_page)
  - `find-and-replace-in-page`: Find and replace text in a page with regex support
- **Dry Run Mode**: Preview which blocks will be deleted before executing
  - `replace-page-content`: Added `dry_run` parameter to preview deletions without making changes
  - Shows block counts grouped by type (e.g., `will_delete_by_type: {paragraph: 5, bookmark: 1}`)
- **Unit Tests**: Added tests for find-and-replace utility functions (textMatches, replaceText)

### Improved

- **Tool Descriptions**: Enhanced descriptions to help LLMs choose the right tool
  - Added warning about non-Markdown blocks being deleted in `replace-page-content`
  - Added Markdown syntax examples to `replace-page-content`
  - Added regex examples to `find-and-replace-in-page`
  - Added cross-references between related tools (update-block-simple, replace-page-content, find-and-replace-in-page)

## [0.9.1] - 2026-01-10

### Fixed

- **Minimal Response Implementation**: Fixed missing minimal response for simple write tools
  - `create-page-simple`: Now correctly returns `{id, url}` (was returning full response)
  - `update-block-simple`: Now correctly returns `{id}` (was returning full response)

## [0.9.0] - 2026-01-10

### Added

- **fields Parameter**: Filter which properties are returned in results
  - `query-data-source`: Added `fields` parameter to limit returned properties
  - `search`: Added `fields` parameter to limit returned properties (simple format only)
- **search format Parameter**: Added `format` parameter (`simple`/`json`) to search tool
  - `simple` (default): Returns compact results with reduced token usage
  - `json`: Returns full Notion API response

### Changed

- **Minimal Response for Write Operations**: All write tools now return only essential data (~90% token reduction)
  - `create-page` / `create-page-simple`: Returns `{id, url}` only
  - `update-page`: Returns `{id, url}` only
  - `move-page`: Returns `{id, url}` only
  - `archive-page`: Returns `{id}` only
  - `create-database`: Returns `{id, url}` only
  - `update-database`: Returns `{id, url}` only
  - `archive-database`: Returns `{id}` only
  - `update-data-source`: Returns `{id}` only
  - `append-block-children` / `append-blocks-simple`: Returns `{block_ids}` only
  - `update-block` / `update-block-simple`: Returns `{id}` only
  - `delete-block`: Returns `{id}` only
  - `create-comment` / `create-comment-simple`: Returns `{id}` only
- **Default Format**: Unified default format to `simple` for all read tools
  - `retrieve-page`: Default changed to `simple`
  - `retrieve-database`: Default changed to `simple`
  - `retrieve-data-source`: Default changed to `simple`
  - `query-data-source`: Default changed to `simple`
  - `search`: Default is `simple`
- **retrieve-data-source Simple Format**: Options now return names only (not full objects with color)
  - Reduces token usage for select/multi_select/status properties

## [0.8.1] - 2026-01-09

### Fixed

- **Documentation**: Fixed incorrect package name in MCP configuration examples
  - Changed `atikk-notion-mcp-server` to `@atikk-co-jp/notion-mcp-server`

## [0.8.0] - 2026-01-08

### Changed

- **Notion Official SDK Migration**: Adopted `@notionhq/client` for improved type safety
  - Removed manually maintained Zod schemas (~2,000 lines deleted)
  - Updated all 28 tools to use official SDK type definitions
  - Significantly improved maintainability

### Added

- **Markdown Table Conversion**: `create-page-simple` and `append-blocks-simple` now support tables
  - Header row and separator row detection
  - Inline formatting within cells (bold, italic, code, links)
  - Alignment specifier support
- **Enhanced Error Messages**: Show format examples on validation errors
  - Helps AI agents self-correct their requests

### Improved

- Changed example values from Japanese to English (internationalization)
- Set noExplicitAny to error in biome.json (stricter type safety)

## [0.7.0] - 2026-01-07

### Added

- **Comment Markdown Input**: `create-comment-simple` tool for adding comments with Markdown
  - Supports **bold**, *italic*, [links](url), `code`
  - Simpler alternative to `create-comment`
- **Enhanced Error Messages**: Validation errors now show available properties
  - Helps identify correct property names when creating/updating pages
  - Only property names and types shown (token-efficient)

### Fixed

- **create-page-simple**: Fixed hardcoded "Name" title property bug
  - Now auto-detects the title property name from data source schema
  - Works with any title property name (e.g., "名前", "タイトル", "Title")
- **create-comment / create-comment-simple**: Fixed API specification alignment
  - `page_id` now optional (was incorrectly required)
  - Added `block_id` for block comments
  - `discussion_id` works without `page_id` for replies
  - Validation: exactly one of page_id/block_id/discussion_id required

### Improved

- **Tool Descriptions**: Enhanced clarity for several tools
  - `query-data-source`: Added filter/sorts examples in description
  - `archive-page`/`archive-database`: Clarified 30-day recovery period
  - `get-block-children`: Added warning about API calls for `fetch_nested`
  - `retrieve-page-property`: Clarified when to use vs `retrieve-page`

## [0.6.0] - 2026-01-07

### Added

- **Page Locking**: `update-page` now supports `is_locked` parameter
  - Lock pages to prevent edits in the Notion UI
  - Set `is_locked: true` to lock, `is_locked: false` to unlock
- **Database Locking**: `update-database` now supports `is_locked` parameter
  - Lock databases to prevent edits in the Notion UI
  - Set `is_locked: true` to lock, `is_locked: false` to unlock

## [0.5.0] - 2026-01-07

### Added

- **Notion API v2025-09-03 Migration**: Full support for the new API version
  - New `data_source` concept replacing direct database queries
  - `retrieve-data-source`: Get data source schema by ID
  - `query-data-source`: Query a data source with filters and sorts
  - `update-data-source`: Update data source schema (add/update/delete properties)
- **Archive Tools**: New dedicated tools for archiving
  - `archive-page`: Archive (delete) a page by moving it to trash
  - `archive-database`: Archive (delete) a database by moving it to trash
- **Page Movement**: `move-page` tool to move pages between parents

### Changed

- **API Version**: Upgraded to Notion API v2025-09-03
- **Tool Updates**: Updated all tools to work with new data_source concept
- **Icon Descriptions**: Clarified that emoji icons must be actual emoji characters (e.g., "📝"), not emoji names

## [0.4.0] - 2026-01-07

### Added

- **11 New Tools**: Expanded Notion API coverage
  - `retrieve-page-property`: Get paginated property values
  - `append-block-children`: Append blocks to pages
  - `append-blocks-simple`: Append blocks using Markdown
  - `retrieve-block`: Get a single block
  - `update-block`: Update block content (JSON)
  - `update-block-simple`: Update block content (Markdown)
  - `delete-block`: Delete/archive a block
  - `create-comment`: Add comments to pages
  - `list-comments`: List comments on pages/blocks
  - `list-users`: List workspace users
  - `retrieve-user`: Get user by ID
  - `retrieve-bot-user`: Get current bot info
- **Markdown Input Support**: Simplified content creation
  - `create-page-simple`: Create pages with Markdown content
  - `append-blocks-simple`: Append Markdown content to pages
  - `update-block-simple`: Update blocks with Markdown

### Changed

- **Improved Documentation**: Enhanced tool descriptions for better AI understanding

## [0.3.0] - 2026-01-07

### Changed

- **Token Optimization**: Minimized MCP tool schema token usage
  - Reduced schema verbosity for lower API costs
  - Optimized property descriptions

## [0.2.2] - 2026-01-07

### Fixed

- **CI/CD**: Switch from pnpm to npm for Trusted Publishing compatibility
- **CI/CD**: Add `--provenance` flag for npm Trusted Publishing

## [0.2.1] - 2026-01-07

### Fixed

- **Documentation**: Fix npx command in usage examples

## [0.2.0] - 2026-01-07

### Added

- **Database Operations**: New tools for database management
  - `create-database`: Create new databases as subpages with custom schema
  - `update-database`: Update database title, description, properties, icon, cover, and archive status
- **Page Content Retrieval**: `retrieve-page` now includes page content as markdown by default
  - New `include_content` parameter to control content inclusion
- **Markdown/Simple Output Format**: Significantly reduced token usage (~96% reduction)
  - `get-block-children` supports `format="markdown"` with `fetch_nested` option
  - `retrieve-page` and `query-database` support `format="simple"`
- **GitHub Actions CI**: Automated lint, type-check, test, and build on push/PR
- **Comprehensive Test Suite**: Unit tests for converters and schemas
- **Biome Integration**: Linting and formatting with Biome

### Changed

- **Improved Tool Descriptions**: Enhanced AI-friendly descriptions for all tools
  - Added usage hints, return value descriptions, and parameter relationships
- **Type Safety**: Replaced `z.any()` with proper Zod type definitions
- **Schema Improvements**: Expanded Zod schemas for better validation
  - Database properties schema
  - Filter and sort schemas
  - Block and rich text schemas
- **Refactored Tools**: Migrated to `server.registerTool` API

### Fixed

- Better error handling with detailed error messages
- Improved response formatting for paginated results

## [0.1.0] - 2026-01-06

### Added

- Initial release
- **Core Tools**:
  - `search`: Search pages and databases
  - `retrieve-page`: Get page properties and content
  - `create-page`: Create new pages in databases
  - `update-page`: Update page properties
  - `retrieve-database`: Get database metadata
  - `query-database`: Query database with filters and sorts
  - `get-block-children`: Get child blocks of a page/block
