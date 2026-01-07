import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatPaginatedResponse, handleErrorWithContext } from '../utils/index.js'

type SearchFilter = { value: 'page' | 'data_source'; property: 'object' }
type SearchSort = { direction: 'ascending' | 'descending'; timestamp: 'last_edited_time' }

interface PaginatedResponse {
  results: unknown[]
  has_more: boolean
  next_cursor: string | null
}

const inputSchema = {
  query: z.string().optional().describe('Text to search for in page titles and content'),
  filter: z
    .object({
      value: z.enum(['page', 'data_source']),
      property: z.literal('object'),
    })
    .optional()
    .describe(
      'Filter to limit results to pages or data sources. ' +
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
        'Search across all pages and data sources in the workspace by title and content. ' +
        'Filter results by type (page or data_source) and sort by last edited time. ' +
        'Returns paginated results. ' +
        'For querying a specific data source with filters, use query-data-source instead. ' +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ query, filter, sort, start_cursor, page_size }) => {
      try {
        const params: {
          query?: string
          filter?: SearchFilter
          sort?: SearchSort
          start_cursor?: string
          page_size?: number
        } = {}

        if (query) {
          params.query = query
        }

        if (filter) {
          params.filter = filter as SearchFilter
        }

        if (sort) {
          params.sort = sort as SearchSort
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
        return handleErrorWithContext(error, notion, {
          exampleType: 'filter',
        })
      }
    },
  )
}
