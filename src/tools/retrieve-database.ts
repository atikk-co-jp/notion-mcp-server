import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  database_id: z.string().describe('Database ID'),
  format: z
    .enum(['json', 'simple'])
    .optional()
    .describe("Output format: 'simple' (default) or 'json'"),
}

interface DatabaseResponse {
  object: 'database'
  id: string
  title: Array<{ plain_text: string }>
  description: Array<{ plain_text: string }>
  url: string
  properties: Record<string, { id: string; type: string; name: string; [key: string]: unknown }>
  created_time: string
  last_edited_time: string
  is_inline: boolean
  archived: boolean
}

interface SimpleProperty {
  id: string
  type: string
  options?: Array<{ name: string; color?: string }>
}

export function registerRetrieveDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-database',
    {
      description:
        'Retrieve a database schema by its ID. Returns database properties (columns) and their types. ' +
        "Use format='simple' (default) for reduced token usage, 'json' for full Notion API response.",
      inputSchema,
    },
    async ({ database_id, format = 'simple' }) => {
      try {
        const response = await notion.databases.retrieve<DatabaseResponse>({ database_id })

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
          title: response.title.map((t) => t.plain_text).join(''),
          description: response.description.map((t) => t.plain_text).join(''),
          url: response.url,
          properties: simpleProperties,
          is_inline: response.is_inline,
          archived: response.archived,
        }

        return formatSimpleResponse(simpleResponse)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
