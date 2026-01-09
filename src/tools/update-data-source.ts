import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  data_source_id: z.string().describe(F.data_source_id),
  properties: z.record(z.string(), z.any()).optional().describe(F.properties_update),
}

// Types derived from inputSchema - guaranteed to match
type Input = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> }
type Properties = NonNullable<Input['properties']>

export function registerUpdateDataSource(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-data-source',
    {
      description:
        'Update a data source schema (properties/columns). ' +
        'Use this to add, update, or delete properties. Set a property to null to delete it. ' +
        'Returns data source ID. (API version 2025-09-03)',
      inputSchema,
    },
    async ({ data_source_id, properties }) => {
      try {
        const params: {
          data_source_id: string
          properties?: Properties
        } = { data_source_id }

        if (properties !== undefined) {
          params.properties = properties as Properties
        }

        const response = await notion.dataSources.update(params)

        // Return minimal response (id only)
        return formatSimpleResponse({
          id: response.id,
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          dataSourceId: data_source_id,
          exampleType: 'schema',
        })
      }
    },
  )
}
