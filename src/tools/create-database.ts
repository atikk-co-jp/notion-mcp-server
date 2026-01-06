import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import {
  CoverSchema,
  IconSchema,
  RichTextArraySchema,
  type RichTextSchema,
} from '../schemas/common.js'
import { DatabasePropertiesSchema } from '../schemas/database.js'
import { formatResponse, handleError } from '../utils/index.js'

type RichText = z.infer<typeof RichTextSchema>
type Icon = z.infer<typeof IconSchema>
type Cover = z.infer<typeof CoverSchema>
type DatabaseProperties = z.infer<typeof DatabasePropertiesSchema>

const inputSchema = {
  parent_page_id: z
    .string()
    .describe('The ID of the parent page where the database will be created'),
  title: RichTextArraySchema.optional().describe(
    'Optional title of the database as an array of rich text objects. ' +
      'Example: [{ "type": "text", "text": { "content": "My Database" } }]',
  ),
  properties: DatabasePropertiesSchema.describe(
    'Database property schema object. Keys are property names, values define the property type and configuration. ' +
      'Each database must have exactly one "title" property. ' +
      'Supported types: title, rich_text, number, select, multi_select, date, people, files, checkbox, url, email, phone_number, formula, relation, rollup, created_time, created_by, last_edited_time, last_edited_by. ' +
      'Example: { "Name": { "title": {} }, "Description": { "rich_text": {} }, "Price": { "number": { "format": "dollar" } }, "Tags": { "multi_select": { "options": [{ "name": "Tag1", "color": "blue" }] } } }',
  ),
  icon: IconSchema.optional().describe(
    'Optional icon for the database. ' +
      'Emoji: { "type": "emoji", "emoji": "📊" }. ' +
      'External: { "type": "external", "external": { "url": "https://..." } }',
  ),
  cover: CoverSchema.optional().describe(
    'Optional cover image for the database. ' +
      'Example: { "type": "external", "external": { "url": "https://..." } }',
  ),
  is_inline: z
    .boolean()
    .optional()
    .describe(
      'Optional. If true, the database will appear as an inline database within the parent page. ' +
        'If false or omitted, it will be a full page database.',
    ),
}

export function registerCreateDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-database',
    {
      description:
        'Create a new database as a subpage of an existing Notion page. ' +
        'Requires a parent_page_id and properties object defining the database schema. ' +
        'Each database must have exactly one title property.',
      inputSchema,
    },
    async ({ parent_page_id, title, properties, icon, cover, is_inline }) => {
      try {
        const params: {
          parent: { page_id: string }
          title?: RichText[]
          properties: DatabaseProperties
          icon?: Icon
          cover?: Cover
          is_inline?: boolean
        } = {
          parent: { page_id: parent_page_id },
          properties: properties as DatabaseProperties,
        }

        if (title) {
          params.title = title as RichText[]
        }

        if (icon) {
          params.icon = icon as Icon
        }

        if (cover) {
          params.cover = cover as Cover
        }

        if (is_inline !== undefined) {
          params.is_inline = is_inline
        }

        const response = await notion.databases.create(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
