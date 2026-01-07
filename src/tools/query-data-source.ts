import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { type NotionProperty, pagesToSimple } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { FilterSchema, SortSchema } from '../schemas/filter.js'
import {
  formatPaginatedResponse,
  formatSimplePaginatedResponse,
  handleErrorWithContext,
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

type Filter = z.infer<typeof FilterSchema>
type Sort = z.infer<typeof SortSchema>

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  data_source_id: z.string().describe('Data source ID'),
  filter: FilterSchema.optional().describe(
    'Filter object. Example: {"property":"Status","select":{"equals":"Done"}}',
  ),
  sorts: z
    .array(SortSchema)
    .optional()
    .describe('Sort array. Example: [{"property":"Date","direction":"descending"}]'),
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().optional().describe('Results per page (1-100)'),
  format: z.enum(['json', 'simple']).optional().describe('Output format (default: simple)'),
}

export function registerQueryDataSource(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'query-data-source',
    {
      description:
        'Query a Notion data source with optional filters and sorts. Returns paginated results. ' +
        "Use format='simple' (default) for human-readable output with reduced token usage. " +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ data_source_id, filter, sorts, start_cursor, page_size, format }) => {
      try {
        const response = await notion.dataSources.query<PaginatedResponse>({
          data_source_id,
          ...(filter && { filter: filter as Filter }),
          ...(sorts && { sorts: sorts as Sort[] }),
          ...(start_cursor && { start_cursor }),
          ...(page_size && { page_size }),
        })

        if (format === 'simple') {
          const simplePages = pagesToSimple(response.results)
          return formatSimplePaginatedResponse(simplePages, response.has_more, response.next_cursor)
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
