# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
