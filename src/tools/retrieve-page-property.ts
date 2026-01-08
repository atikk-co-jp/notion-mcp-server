import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatPaginatedResponse, formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe(F.page_id),
  property_id: z.string().describe(F.property_id),
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().optional().describe(F.page_size),
}

export function registerRetrievePageProperty(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-page-property',
    {
      description:
        'Get a property with pagination (for relation/rollup with many items). For simple properties, use retrieve-page instead.',
      inputSchema,
    },
    async ({ page_id, property_id, start_cursor, page_size }) => {
      try {
        const response = await notion.pages.properties.retrieve({
          page_id,
          property_id,
          start_cursor,
          page_size,
        })

        // If it's a paginated list response
        if (response.object === 'list' && response.results) {
          return formatPaginatedResponse(
            response.results,
            response.has_more ?? false,
            response.next_cursor ?? null,
          )
        }

        // Single property item
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
