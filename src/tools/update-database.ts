import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  database_id: z.string().describe('Database ID'),
  title: z.array(z.any()).optional().describe('New title'),
  description: z.array(z.any()).optional().describe('New description'),
  properties: z.record(z.string(), z.any()).optional().describe('Properties to add/update/delete'),
  icon: z.any().optional().describe('Icon (null to remove)'),
  cover: z.any().optional().describe('Cover (null to remove)'),
  is_inline: z.boolean().optional().describe('Inline database'),
  archived: z.boolean().optional().describe('Archive status'),
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
          title?: Array<{ type?: string; text: { content: string } }>
          description?: Array<{ type?: string; text: { content: string } }>
          properties?: Record<string, unknown>
          icon?: { type: string; emoji?: string; external?: { url: string } } | null
          cover?: { type: string; external: { url: string } } | null
          is_inline?: boolean
          archived?: boolean
        } = {
          database_id,
        }

        if (title !== undefined) {
          params.title = title as Array<{ type?: string; text: { content: string } }>
        }

        if (description !== undefined) {
          params.description = description as Array<{ type?: string; text: { content: string } }>
        }

        if (properties !== undefined) {
          params.properties = properties as Record<string, unknown>
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.databases.update(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
