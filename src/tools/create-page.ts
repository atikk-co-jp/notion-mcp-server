import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  data_source_id: z.string().describe(F.data_source_id),
  properties: z.record(z.string(), z.any()).describe(F.properties),
  children: z.array(z.any()).optional().describe(F.children),
  icon: z.any().optional().describe(F.icon),
  cover: z.any().optional().describe(F.cover),
}

// Types derived from inputSchema - guaranteed to match
type Input = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> }
type Properties = Input['properties']
type Children = NonNullable<Input['children']>
type Icon = NonNullable<Input['icon']>
type Cover = NonNullable<Input['cover']>

export function registerCreatePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page',
    {
      description:
        'Create a new page in a Notion data source. Requires a data_source_id and properties object. ' +
        'Optionally include initial content blocks, icon, and cover image. ' +
        'Returns the created page with its ID and URL. (API version 2025-09-03)',
      inputSchema,
    },
    async ({ data_source_id, properties, children, icon, cover }) => {
      try {
        const params: {
          parent: { data_source_id: string }
          properties: Properties
          children?: Children
          icon?: Icon
          cover?: Cover
        } = {
          parent: { data_source_id },
          properties: properties as Properties,
        }

        if (children) {
          params.children = children as Children
        }

        if (icon) {
          params.icon = icon as Icon
        }

        if (cover) {
          params.cover = cover as Cover
        }

        const response = await notion.pages.create(params)
        return formatResponse(response)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          dataSourceId: data_source_id,
          exampleType: 'page',
        })
      }
    },
  )
}
