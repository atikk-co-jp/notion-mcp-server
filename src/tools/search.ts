import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatPaginatedResponse, handleErrorWithContext } from '../utils/index.js'

const inputSchema = {
  query: z.string().optional().describe(F.query),
  filter: z
    .object({
      value: z.enum(['page', 'data_source']),
      property: z.literal('object'),
    })
    .optional()
    .describe(F.filter_search),
  sort: z
    .object({
      direction: z.enum(['ascending', 'descending']),
      timestamp: z.literal('last_edited_time'),
    })
    .optional()
    .describe(F.sort),
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().min(1).max(100).optional().describe(F.page_size),
}

// Types derived from inputSchema - guaranteed to match
type Input = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> }
type Filter = NonNullable<Input['filter']>
type Sort = NonNullable<Input['sort']>

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
          filter?: Filter
          sort?: Sort
          start_cursor?: string
          page_size?: number
        } = {}

        if (query) {
          params.query = query
        }

        if (filter) {
          params.filter = filter as Filter
        }

        if (sort) {
          params.sort = sort as Sort
        }

        if (start_cursor) {
          params.start_cursor = start_cursor
        }

        if (page_size) {
          params.page_size = page_size
        }

        const response = await notion.search(params)
        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'filter',
        })
      }
    },
  )
}
