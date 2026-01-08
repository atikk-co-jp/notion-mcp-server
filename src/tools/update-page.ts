import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  page_id: z.string().describe(F.page_id),
  properties: z.record(z.string(), z.any()).optional().describe(F.properties),
  archived: z.boolean().optional().describe(F.archived),
  icon: z.any().optional().describe(F.icon),
  cover: z.any().optional().describe(F.cover),
  is_locked: z.boolean().optional().describe(F.is_locked),
}

// Types derived from inputSchema - guaranteed to match
type Input = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> }
type Properties = NonNullable<Input['properties']>
type Icon = NonNullable<Input['icon']>
type Cover = NonNullable<Input['cover']>

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
          properties?: Properties
          archived?: boolean
          icon?: Icon | null
          cover?: Cover | null
          is_locked?: boolean
        } = { page_id }

        if (properties !== undefined) {
          params.properties = properties as Properties
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
        // Note: update-page uses page_id, not data_source_id,
        // so we can't fetch property list, but we can still show format examples
        return handleErrorWithContext(error, notion, {
          exampleType: 'page',
        })
      }
    },
  )
}
