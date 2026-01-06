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
  database_id: z.string().describe('The ID of the database to update'),
  title: RichTextArraySchema.optional().describe(
    'Optional new title for the database as an array of rich text objects. ' +
      'Example: [{ "type": "text", "text": { "content": "Updated Database Title" } }]',
  ),
  description: RichTextArraySchema.optional().describe(
    'Optional new description for the database as an array of rich text objects. ' +
      'Example: [{ "type": "text", "text": { "content": "Database description" } }]',
  ),
  properties: DatabasePropertiesSchema.optional().describe(
    'Optional properties to add or update. Keys are property names, values define the property type and configuration. ' +
      'To add a new property, include its full schema. To update an existing property, provide the property name with its new configuration. ' +
      'To rename a property, use the property ID as key with a "name" field. ' +
      'To delete a property, set it to null. ' +
      'Supported types: title, rich_text, number, select, multi_select, date, people, files, checkbox, url, email, phone_number, formula, relation, rollup, created_time, created_by, last_edited_time, last_edited_by. ' +
      'Example: { "NewColumn": { "rich_text": {} }, "Price": { "number": { "format": "euro" } } }',
  ),
  icon: IconSchema.nullable()
    .optional()
    .describe(
      'Optional icon for the database. Set to null to remove the icon. ' +
        'Emoji: { "type": "emoji", "emoji": "📊" }. ' +
        'External: { "type": "external", "external": { "url": "https://..." } }',
    ),
  cover: CoverSchema.nullable()
    .optional()
    .describe(
      'Optional cover image for the database. Set to null to remove the cover. ' +
        'Example: { "type": "external", "external": { "url": "https://..." } }',
    ),
  is_inline: z
    .boolean()
    .optional()
    .describe(
      'Optional. If true, the database will appear as an inline database. ' +
        'If false, it will be a full page database.',
    ),
  archived: z
    .boolean()
    .optional()
    .describe('Optional. Set to true to archive the database, false to unarchive.'),
}

export function registerUpdateDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-database',
    {
      description:
        'Update an existing Notion database. Can modify title, description, properties (add/update/delete columns), icon, cover, inline status, and archive status. ' +
        'Returns the updated database object.',
      inputSchema,
    },
    async ({ database_id, title, description, properties, icon, cover, is_inline, archived }) => {
      try {
        const params: {
          database_id: string
          title?: RichText[]
          description?: RichText[]
          properties?: DatabaseProperties
          icon?: Icon | null
          cover?: Cover | null
          is_inline?: boolean
          archived?: boolean
        } = {
          database_id,
        }

        if (title !== undefined) {
          params.title = title as RichText[]
        }

        if (description !== undefined) {
          params.description = description as RichText[]
        }

        if (properties !== undefined) {
          params.properties = properties as DatabaseProperties
        }

        if (icon !== undefined) {
          params.icon = icon as Icon | null
        }

        if (cover !== undefined) {
          params.cover = cover as Cover | null
        }

        if (is_inline !== undefined) {
          params.is_inline = is_inline
        }

        if (archived !== undefined) {
          params.archived = archived
        }

        const response = await notion.databases.update(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
