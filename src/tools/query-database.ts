import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { type NotionProperty, pagesToSimple } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { FilterSchema, SortsSchema } from '../schemas/filter.js'
import {
  formatPaginatedResponse,
  formatSimplePaginatedResponse,
  handleError,
} from '../utils/index.js'

interface PageResult {
  id: string
  url?: string
  properties: Record<string, NotionProperty>
  [key: string]: unknown
}

interface PaginatedResponse {
  results: PageResult[]
  has_more: boolean
  next_cursor: string | null
}

const inputSchema = {
  database_id: z.string().describe('The ID of the database to query'),
  filter: FilterSchema.optional().describe(
    'Filter conditions. ' +
      'Property filter: { "property": "Status", "status": { "equals": "Done" } }. ' +
      'Compound filter: { "and": [...] } or { "or": [...] }. ' +
      'Supported property types: title, rich_text, number, checkbox, select, multi_select, status, date, relation.',
  ),
  sorts: SortsSchema.optional().describe(
    'Sort conditions array. ' +
      'By property: { "property": "Name", "direction": "ascending" }. ' +
      'By timestamp: { "timestamp": "created_time", "direction": "descending" }.',
  ),
  start_cursor: z
    .string()
    .optional()
    .describe('Cursor for pagination. Use the next_cursor from previous response.'),
  page_size: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of results to return (1-100). Default is 100.'),
  format: z
    .enum(['json', 'simple'])
    .optional()
    .default('simple')
    .describe(
      "Output format: 'simple' (default) returns simplified property values with reduced token usage, 'json' returns raw Notion API response",
    ),
}

export function registerQueryDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'query-database',
    {
      description:
        "Query a Notion database with optional filters and sorts. Returns paginated results. Use format='simple' (default) for human-readable output with reduced token usage.",
      inputSchema,
    },
    async ({ database_id, filter, sorts, start_cursor, page_size, format }) => {
      try {
        const params: {
          database_id: string
          filter?: unknown
          sorts?: unknown[]
          start_cursor?: string
          page_size?: number
        } = { database_id }

        if (filter) {
          params.filter = filter
        }

        if (sorts) {
          params.sorts = sorts
        }

        if (start_cursor) {
          params.start_cursor = start_cursor
        }

        if (page_size) {
          params.page_size = page_size
        }

        const response = await notion.databases.query<PaginatedResponse>(params)

        if (format === 'simple') {
          const simplePages = pagesToSimple(response.results)
          return formatSimplePaginatedResponse(simplePages, response.has_more, response.next_cursor)
        }

        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
