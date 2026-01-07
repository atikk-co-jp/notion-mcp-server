import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import type { Block } from '../schemas/block.js'
import type { PropertyValueSchema } from '../schemas/page.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

type PropertyValue = z.infer<typeof PropertyValueSchema>
type Icon = { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } }
type Cover = { type: 'external'; external: { url: string } }

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  data_source_id: z.string().describe('Data source ID (required in API 2025-09-03)'),
  properties: z.record(z.string(), z.any()).describe('Notion properties object'),
  children: z.array(z.any()).optional().describe('Block objects array'),
  icon: z
    .any()
    .optional()
    .describe(
      'Page icon { type: "emoji", emoji: "📝" } or { type: "external", external: { url: "..." } }. Emoji must be an actual emoji character.',
    ),
  cover: z.any().optional().describe('Cover image'),
}

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
          properties: Record<string, PropertyValue>
          children?: Block[]
          icon?: Icon
          cover?: Cover
        } = {
          parent: { data_source_id },
          properties: properties as Record<string, PropertyValue>,
        }

        if (children) {
          params.children = children as Block[]
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
        return handleErrorWithContext(error, notion, data_source_id)
      }
    },
  )
}
