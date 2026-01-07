import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatPaginatedResponse, formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe('Page ID'),
  property_id: z.string().describe('Property ID (from page properties)'),
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().optional().describe('Number of results (1-100)'),
}

interface PropertyItemResponse {
  object: 'property_item' | 'list'
  type: string
  results?: Array<unknown>
  next_cursor?: string | null
  has_more?: boolean
  [key: string]: unknown
}

export function registerRetrievePageProperty(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-page-property',
    {
      description:
        'Retrieve a specific property value from a page. Supports pagination for properties with many values (e.g., rollup, relation). ' +
        'Use the property_id from the page properties object.',
      inputSchema,
    },
    async ({ page_id, property_id, start_cursor, page_size }) => {
      try {
        const response = await notion.pages.retrieveProperty<PropertyItemResponse>({
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
