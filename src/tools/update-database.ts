import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { CoverSchema, IconSchema, RichTextArraySchema } from '../schemas/common.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
// Note: Properties (schema) updates should use update-data-source in API 2025-09-03
const inputSchema = {
  database_id: z.string().describe('Database ID'),
  title: RichTextArraySchema.optional().describe('New title'),
  description: RichTextArraySchema.optional().describe('New description'),
  icon: IconSchema.nullable()
    .optional()
    .describe(
      'Icon object { type: "emoji", emoji: "📝" } or null to remove. Emoji must be an actual emoji character.',
    ),
  cover: CoverSchema.nullable().optional().describe('Cover (null to remove)'),
  is_inline: z.boolean().optional().describe('Inline database'),
  archived: z.boolean().optional().describe('Archive status'),
  is_locked: z
    .boolean()
    .optional()
    .describe(
      'Lock the database to prevent edits in the UI. Set to true to lock, false to unlock.',
    ),
}

type RichText = z.infer<typeof RichTextArraySchema>[number]
type Icon = z.infer<typeof IconSchema>
type Cover = z.infer<typeof CoverSchema>

export function registerUpdateDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-database',
    {
      description:
        'Update a Notion database container. Can modify title, description, icon, cover, inline status, archive status, and lock status. ' +
        'For schema (properties/columns) updates, use update-data-source instead. (API version 2025-09-03)',
      inputSchema,
    },
    async ({ database_id, title, description, icon, cover, is_inline, archived, is_locked }) => {
      try {
        const params: {
          database_id: string
          title?: RichText[]
          description?: RichText[]
          icon?: Icon | null
          cover?: Cover | null
          is_inline?: boolean
          archived?: boolean
          is_locked?: boolean
        } = {
          database_id,
        }

        if (title !== undefined) {
          params.title = title as RichText[]
        }

        if (description !== undefined) {
          params.description = description as RichText[]
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

        if (is_locked !== undefined) {
          params.is_locked = is_locked
        }

        const response = await notion.databases.update(params)
        return formatResponse(response)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'richTextArray',
        })
      }
    },
  )
}
