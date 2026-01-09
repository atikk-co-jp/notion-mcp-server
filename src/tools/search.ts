import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { pagesToSimple } from '../converters/index.js'
import { isFullPage, type NotionClient, type PageObjectResponse } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import {
  formatPaginatedResponse,
  formatSimplePaginatedResponse,
  handleErrorWithContext,
} from '../utils/index.js'

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
  format: z.enum(['json', 'simple']).optional().default('simple').describe(F.format),
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
        "Use format='simple' (default) for human-readable output with reduced token usage. " +
        'For querying a specific data source with filters, use query-data-source instead. ' +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ query, filter, sort, start_cursor, page_size, format }) => {
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

        if (format === 'simple') {
          // Convert results to simple format
          const simpleResults = response.results.map((result) => {
            if (result.object === 'page' && isFullPage(result)) {
              // Use pagesToSimple for pages
              const [simplePage] = pagesToSimple([result as unknown as PageObjectResponse])
              return { object: 'page', ...simplePage }
            }
            if (result.object === 'data_source') {
              // Simple format for data sources
              const ds = result as unknown as {
                id: string
                title?: Array<{ plain_text: string }>
                url?: string
              }
              return {
                object: 'data_source',
                id: ds.id,
                title: ds.title?.map((t) => t.plain_text).join('') ?? '',
                url: ds.url ?? '',
              }
            }
            // Fallback for partial objects
            return {
              object: result.object,
              id: result.id,
            }
          })
          return formatSimplePaginatedResponse(
            simpleResults,
            response.has_more,
            response.next_cursor,
          )
        }

        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'filter',
        })
      }
    },
  )
}
