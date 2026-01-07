import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  data_source_id: z.string().describe('Data source ID'),
  format: z
    .enum(['json', 'simple'])
    .optional()
    .describe("Output format: 'simple' (default) or 'json'"),
}

interface DataSourceResponse {
  object: 'data_source'
  id: string
  parent: { type: 'database_id'; database_id: string }
  database_parent: { type: 'page_id' | 'workspace'; page_id?: string }
  properties: Record<string, { id: string; type: string; name: string; [key: string]: unknown }>
  created_time: string
  last_edited_time: string
}

interface SimpleProperty {
  id: string
  type: string
  options?: Array<{ name: string; color?: string }>
}

export function registerRetrieveDataSource(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-data-source',
    {
      description:
        'Retrieve a data source schema by its ID. Returns data source properties (columns) and their types. ' +
        "Use format='simple' (default) for reduced token usage, 'json' for full Notion API response. " +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ data_source_id, format = 'simple' }) => {
      try {
        const response = await notion.dataSources.retrieve<DataSourceResponse>({ data_source_id })

        if (format === 'json') {
          return formatResponse(response)
        }

        // Simple format: extract essential info
        const simpleProperties: Record<string, SimpleProperty> = {}

        for (const [name, prop] of Object.entries(response.properties)) {
          const simpleProp: SimpleProperty = {
            id: prop.id,
            type: prop.type,
          }

          // Include options for select/multi_select/status
          if (prop.type === 'select' && prop.select) {
            const selectProp = prop.select as { options?: Array<{ name: string; color?: string }> }
            simpleProp.options = selectProp.options
          } else if (prop.type === 'multi_select' && prop.multi_select) {
            const multiSelectProp = prop.multi_select as {
              options?: Array<{ name: string; color?: string }>
            }
            simpleProp.options = multiSelectProp.options
          } else if (prop.type === 'status' && prop.status) {
            const statusProp = prop.status as { options?: Array<{ name: string; color?: string }> }
            simpleProp.options = statusProp.options
          }

          simpleProperties[name] = simpleProp
        }

        const simpleResponse = {
          id: response.id,
          parent_database_id: response.parent.database_id,
          properties: simpleProperties,
        }

        return formatSimpleResponse(simpleResponse)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
