import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { BlockChildrenSchema } from '../schemas/block.js'
import { CoverSchema, IconSchema } from '../schemas/common.js'
import { PropertiesSchema } from '../schemas/page.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  database_id: z.string().describe('The ID of the database where the page will be created'),
  properties: PropertiesSchema.describe(
    'Page properties object. Keys are property names, values follow Notion property format. ' +
      'Supported types: title, rich_text, number, select, multi_select, status, date, checkbox, url, email, phone_number, relation, people, files. ' +
      'Example: { "Name": { "title": [{ "text": { "content": "My Page" } }] }, "Status": { "status": { "name": "In Progress" } } }',
  ),
  children: BlockChildrenSchema.optional().describe(
    'Optional array of block objects for the page content. ' +
      'Supported types: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, code, quote, callout, divider, bookmark, image, video, embed, table_of_contents. ' +
      'Example: [{ "type": "paragraph", "paragraph": { "rich_text": [{ "text": { "content": "Hello" } }] } }]',
  ),
  icon: IconSchema.optional().describe(
    'Optional icon for the page. ' +
      'Emoji: { "type": "emoji", "emoji": "🚀" }. ' +
      'External: { "type": "external", "external": { "url": "https://..." } }',
  ),
  cover: CoverSchema.optional().describe(
    'Optional cover image for the page. ' +
      'Example: { "type": "external", "external": { "url": "https://..." } }',
  ),
}

export function registerCreatePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page',
    {
      description:
        'Create a new page in a Notion database. Requires a database_id and properties object.',
      inputSchema,
    },
    async ({ database_id, properties, children, icon, cover }) => {
      try {
        const params: {
          parent: { database_id: string }
          properties: Record<string, unknown>
          children?: unknown[]
          icon?: unknown
          cover?: unknown
        } = {
          parent: { database_id },
          properties,
        }

        if (children) {
          params.children = children
        }

        if (icon) {
          params.icon = icon
        }

        if (cover) {
          params.cover = cover
        }

        const response = await notion.pages.create(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
