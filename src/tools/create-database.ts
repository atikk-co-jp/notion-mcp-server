import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { CoverSchema, IconSchema, RichTextArraySchema } from '../schemas/common.js'
import type { DatabasePropertiesSchema } from '../schemas/database.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

type RichText = z.infer<typeof RichTextArraySchema>[number]
type Icon = z.infer<typeof IconSchema>
type Cover = z.infer<typeof CoverSchema>
type DatabaseProperties = z.infer<typeof DatabasePropertiesSchema>

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  parent_page_id: z.string().describe('Parent page ID'),
  title: RichTextArraySchema.optional().describe('Database title'),
  properties: z
    .record(z.string(), z.any())
    .describe('Property schema (must include one title property)'),
  icon: IconSchema.optional().describe(
    'Database icon { type: "emoji", emoji: "📝" } or { type: "external", external: { url: "..." } }. Emoji must be an actual emoji character.',
  ),
  cover: CoverSchema.optional().describe('Cover image'),
  is_inline: z.boolean().optional().describe('Inline database'),
}

export function registerCreateDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-database',
    {
      description:
        'Create a new database as a subpage of an existing Notion page. ' +
        'Requires a parent_page_id and properties object defining the database schema. ' +
        'Each database must have exactly one title property. (API version 2025-09-03)',
      inputSchema,
    },
    async ({ parent_page_id, title, properties, icon, cover, is_inline }) => {
      try {
        const params: {
          parent: { page_id: string }
          title?: RichText[]
          initial_data_source?: { properties: DatabaseProperties }
          icon?: Icon
          cover?: Cover
          is_inline?: boolean
        } = {
          parent: { page_id: parent_page_id },
          initial_data_source: { properties: properties as DatabaseProperties },
        }

        if (title !== undefined) {
          params.title = title as RichText[]
        }

        if (icon !== undefined) {
          params.icon = icon as Icon
        }

        if (cover !== undefined) {
          params.cover = cover as Cover
        }

        if (is_inline !== undefined) {
          params.is_inline = is_inline
        }

        const response = await notion.databases.create(params)
        return formatResponse(response)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'schema',
        })
      }
    },
  )
}
