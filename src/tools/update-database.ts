import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
// Note: Properties (schema) updates should use update-data-source in API 2025-09-03
// Uses z.any() for title/description/icon/cover to reduce context size (~3,700 tokens saved)
const inputSchema = {
  database_id: z.string().describe(F.database_id),
  title: z.any().optional().describe(F.title),
  description: z.any().optional().describe(F.description),
  icon: z.any().nullable().optional().describe(F.icon),
  cover: z.any().nullable().optional().describe(F.cover),
  is_inline: z.boolean().optional().describe(F.is_inline),
  archived: z.boolean().optional().describe(F.archived),
  is_locked: z.boolean().optional().describe(F.is_locked),
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
        // Build params with only defined values (API validates full structure)
        const params = {
          database_id,
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(icon !== undefined && { icon }),
          ...(cover !== undefined && { cover }),
          ...(is_inline !== undefined && { is_inline }),
          ...(archived !== undefined && { archived }),
          ...(is_locked !== undefined && { is_locked }),
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.databases.update(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'richTextArray',
        })
      }
    },
  )
}
