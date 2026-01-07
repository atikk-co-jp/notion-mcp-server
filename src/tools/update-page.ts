import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import type { PropertyValueSchema } from '../schemas/page.js'
import { formatResponse, handleError } from '../utils/index.js'

type PropertyValue = z.infer<typeof PropertyValueSchema>
type Icon = { type: 'emoji'; emoji: string } | { type: 'external'; external: { url: string } }
type Cover = { type: 'external'; external: { url: string } }

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  page_id: z.string().describe('Page ID'),
  properties: z.record(z.string(), z.any()).optional().describe('Properties to update'),
  archived: z.boolean().optional().describe('Archive the page'),
  icon: z.any().optional().describe('Page icon { type: "emoji", emoji: "📝" } or { type: "external", external: { url: "..." } }, or null to remove. Emoji must be an actual emoji character.'),
  cover: z.any().optional().describe('Cover image (null to remove)'),
  is_locked: z.boolean().optional().describe('Lock the page to prevent edits in the UI. Set to true to lock, false to unlock.'),
}

export function registerUpdatePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-page',
    {
      description:
        "Update a Notion page's properties, icon, cover, archive status, or lock status. " +
        'Partial updates are supported - only provide the fields you want to change. ' +
        'Set icon or cover to null to remove them. ' +
        'Set archived to true to move the page to trash. ' +
        'Set is_locked to true to lock the page in the UI.',
      inputSchema,
    },
    async ({ page_id, properties, archived, icon, cover, is_locked }) => {
      try {
        const params: {
          page_id: string
          properties?: Record<string, PropertyValue>
          archived?: boolean
          icon?: Icon | null
          cover?: Cover | null
          is_locked?: boolean
        } = { page_id }

        if (properties !== undefined) {
          params.properties = properties as Record<string, PropertyValue>
        }

        if (archived !== undefined) {
          params.archived = archived
        }

        if (icon !== undefined) {
          params.icon = icon as Icon | null
        }

        if (cover !== undefined) {
          params.cover = cover as Cover | null
        }

        if (is_locked !== undefined) {
          params.is_locked = is_locked
        }

        const response = await notion.pages.update(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
