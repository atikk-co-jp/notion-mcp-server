# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
