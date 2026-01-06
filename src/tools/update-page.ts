import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { CoverSchema, IconSchema } from '../schemas/common.js'
import { PropertiesSchema } from '../schemas/page.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe('The ID of the page to update'),
  properties: PropertiesSchema.optional().describe(
    'Properties to update. Keys are property names, values follow Notion property format. ' +
      'Supported types: title, rich_text, number, select, multi_select, status, date, checkbox, url, email, phone_number, relation, people, files. ' +
      'Example: { "Status": { "status": { "name": "Done" } } }',
  ),
  archived: z.boolean().optional().describe('Set to true to archive (delete) the page'),
  icon: IconSchema.nullable()
    .optional()
    .describe(
      'Icon for the page. ' +
        'Emoji: { "type": "emoji", "emoji": "🚀" }. ' +
        'External: { "type": "external", "external": { "url": "https://..." } }. ' +
        'Set to null to remove.',
    ),
  cover: CoverSchema.nullable()
    .optional()
    .describe(
      'Cover image for the page. ' +
        'Example: { "type": "external", "external": { "url": "https://..." } }. ' +
        'Set to null to remove.',
    ),
}

export function registerUpdatePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-page',
    {
      description: "Update a Notion page's properties, icon, cover, or archive status.",
      inputSchema,
    },
    async ({ page_id, properties, archived, icon, cover }) => {
      try {
        const params: {
          page_id: string
          properties?: Record<string, unknown>
          archived?: boolean
          icon?: unknown
          cover?: unknown
        } = { page_id }

        if (properties !== undefined) {
          params.properties = properties
        }

        if (archived !== undefined) {
          params.archived = archived
        }

        if (icon !== undefined) {
          params.icon = icon
        }

        if (cover !== undefined) {
          params.cover = cover
        }

        const response = await notion.pages.update(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
