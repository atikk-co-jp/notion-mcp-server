import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  data_source_id: z.string().describe('Data source ID'),
  properties: z
    .record(z.string(), z.any())
    .optional()
    .describe('Properties to add/update/delete (set to null to delete)'),
}

export function registerUpdateDataSource(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-data-source',
    {
      description:
        'Update a data source schema (properties/columns). ' +
        'Use this to add, update, or delete properties. Set a property to null to delete it. ' +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ data_source_id, properties }) => {
      try {
        const params: {
          data_source_id: string
          properties?: Record<string, unknown>
        } = { data_source_id }

        if (properties !== undefined) {
          params.properties = properties as Record<string, unknown>
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.dataSources.update(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleErrorWithContext(error, notion, data_source_id)
      }
    },
  )
}
