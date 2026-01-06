import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatPaginatedResponse, handleError } from '../utils/index.js'

interface PaginatedResponse {
  results: unknown[]
  has_more: boolean
  next_cursor: string | null
}

const inputSchema = {
  query: z.string().optional().describe('Text to search for in page titles and content'),
  filter: z
    .object({
      value: z.enum(['page', 'database']),
      property: z.literal('object'),
    })
    .optional()
    .describe(
      'Filter to limit results to pages or databases. ' +
        'Example: { "value": "page", "property": "object" }',
    ),
  sort: z
    .object({
      direction: z.enum(['ascending', 'descending']),
      timestamp: z.literal('last_edited_time'),
    })
    .optional()
    .describe(
      'Sort order for results. ' +
        'Example: { "direction": "descending", "timestamp": "last_edited_time" }',
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
}

export function registerSearch(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'search',
    {
      description:
        'Search across all pages and databases in the workspace. Returns paginated results.',
      inputSchema,
    },
    async ({ query, filter, sort, start_cursor, page_size }) => {
      try {
        const params: {
          query?: string
          filter?: unknown
          sort?: unknown
          start_cursor?: string
          page_size?: number
        } = {}

        if (query) {
          params.query = query
        }

        if (filter) {
          params.filter = filter
        }

        if (sort) {
          params.sort = sort
        }

        if (start_cursor) {
          params.start_cursor = start_cursor
        }

        if (page_size) {
          params.page_size = page_size
        }

        const response = await notion.search<PaginatedResponse>(params)
        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
