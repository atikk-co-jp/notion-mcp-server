import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { type NotionProperty, pagesToSimple } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
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

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  database_id: z.string().describe('Database ID'),
  filter: z.any().optional().describe('Filter conditions'),
  sorts: z.array(z.any()).optional().describe('Sort conditions'),
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().optional().describe('Results per page (1-100)'),
  format: z.enum(['json', 'simple']).optional().describe('Output format (default: simple)'),
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
          filter?: Record<string, unknown>
          sorts?: Array<{ property?: string; timestamp?: string; direction: string }>
          start_cursor?: string
          page_size?: number
        } = { database_id }

        if (filter) {
          params.filter = filter as Record<string, unknown>
        }

        if (sorts) {
          params.sorts = sorts as Array<{ property?: string; timestamp?: string; direction: string }>
        }

        if (start_cursor) {
          params.start_cursor = start_cursor
        }

        if (page_size) {
          params.page_size = page_size
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.databases.query<PaginatedResponse>(params as any)

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
