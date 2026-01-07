import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
// Note: Properties (schema) updates should use update-data-source in API 2025-09-03
const inputSchema = {
  database_id: z.string().describe('Database ID'),
  title: z.array(z.any()).optional().describe('New title'),
  description: z.array(z.any()).optional().describe('New description'),
  icon: z
    .any()
    .optional()
    .describe(
      'Icon object { type: "emoji", emoji: "📝" } or null to remove. Emoji must be an actual emoji character.',
    ),
  cover: z.any().optional().describe('Cover (null to remove)'),
  is_inline: z.boolean().optional().describe('Inline database'),
  archived: z.boolean().optional().describe('Archive status'),
  is_locked: z
    .boolean()
    .optional()
    .describe(
      'Lock the database to prevent edits in the UI. Set to true to lock, false to unlock.',
    ),
}

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
          title?: Array<{ type?: string; text: { content: string } }>
          description?: Array<{ type?: string; text: { content: string } }>
          icon?: { type: string; emoji?: string; external?: { url: string } } | null
          cover?: { type: string; external: { url: string } } | null
          is_inline?: boolean
          archived?: boolean
          is_locked?: boolean
        } = {
          database_id,
        }

        if (title !== undefined) {
          params.title = title as Array<{ type?: string; text: { content: string } }>
        }

        if (description !== undefined) {
          params.description = description as Array<{ type?: string; text: { content: string } }>
        }

        if (icon !== undefined) {
          params.icon = icon as { type: string; emoji?: string; external?: { url: string } } | null
        }

        if (cover !== undefined) {
          params.cover = cover as { type: string; external: { url: string } } | null
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.databases.update(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
