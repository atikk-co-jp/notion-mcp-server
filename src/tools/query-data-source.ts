import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { pagesToFlat, pagesToSimple } from '../converters/index.js'
import { isFullPage, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import {
  formatPaginatedResponse,
  formatSimplePaginatedResponse,
  handleErrorWithContext,
} from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
// Uses z.any() for filter/sorts to reduce context size (~8,000 tokens saved)
const inputSchema = {
  data_source_id: z.string().describe(F.data_source_id),
  filter: z.any().optional().describe(F.filter),
  sorts: z.array(z.any()).optional().describe(F.sorts),
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().optional().describe(F.page_size),
  format: z.enum(['json', 'simple', 'flat']).optional().describe(F.format_query),
  fields: z.array(z.string()).optional().describe(F.fields),
}

export function registerQueryDataSource(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'query-data-source',
    {
      description:
        'Query a Notion data source with optional filters and sorts. Returns paginated results. ' +
        "Use format='flat' for minimal output with only property values (no id/url). " +
        "Use format='simple' for output with id, url, and properties. " +
        'Use fields parameter to limit which properties are returned (flat/simple format only). ' +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ data_source_id, filter, sorts, start_cursor, page_size, format, fields }) => {
      try {
        const response = await notion.dataSources.query({
          data_source_id,
          ...(filter && { filter }),
          ...(sorts && { sorts }),
          ...(start_cursor && { start_cursor }),
          ...(page_size && { page_size }),
        })

        // Filter to full pages for simple/flat format converters
        const fullPages = response.results.filter(isFullPage)

        if (format === 'flat') {
          // Flat format: only property values, no id/url
          const flatPages = pagesToFlat(
            fullPages as unknown as Parameters<typeof pagesToFlat>[0],
            fields,
          )
          return formatSimplePaginatedResponse(flatPages, response.has_more, response.next_cursor)
        }

        if (format === 'simple') {
          // Simple format: id, url, and properties
          const simplePages = pagesToSimple(
            fullPages as unknown as Parameters<typeof pagesToSimple>[0],
            fields,
          )
          return formatSimplePaginatedResponse(simplePages, response.has_more, response.next_cursor)
        }

        // JSON format: full Notion API response
        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'filter',
        })
      }
    },
  )
}
