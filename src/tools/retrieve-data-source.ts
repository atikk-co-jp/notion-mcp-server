import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { isFullDataSource, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  data_source_id: z.string().describe(F.data_source_id),
  format: z.enum(['json', 'simple']).optional().default('simple').describe(F.format),
}

interface SimpleSchemaProperty {
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
        const response = await notion.dataSources.retrieve({ data_source_id })

        if (format === 'json') {
          return formatResponse(response)
        }

        // Need full data source for simple format
        if (!isFullDataSource(response)) {
          return formatResponse(response)
        }

        // Simple format: extract essential info
        const simpleProperties: Record<string, SimpleSchemaProperty> = {}

        for (const [name, prop] of Object.entries(response.properties)) {
          const simpleProp: SimpleSchemaProperty = {
            id: prop.id,
            type: prop.type,
          }

          // Include options for select/multi_select/status
          const propAny = prop as Record<string, unknown>
          if (prop.type === 'select' && propAny.select) {
            const selectProp = propAny.select as {
              options?: Array<{ name: string; color?: string }>
            }
            simpleProp.options = selectProp.options
          } else if (prop.type === 'multi_select' && propAny.multi_select) {
            const multiSelectProp = propAny.multi_select as {
              options?: Array<{ name: string; color?: string }>
            }
            simpleProp.options = multiSelectProp.options
          } else if (prop.type === 'status' && propAny.status) {
            const statusProp = propAny.status as {
              options?: Array<{ name: string; color?: string }>
            }
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
