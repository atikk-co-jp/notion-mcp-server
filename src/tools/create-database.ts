import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  parent_page_id: z.string().describe('Parent page ID'),
  title: z.array(z.any()).optional().describe('Database title'),
  properties: z
    .record(z.string(), z.any())
    .describe('Property schema (must include one title property)'),
  icon: z.any().optional().describe('Database icon { type: "emoji", emoji: "📝" } or { type: "external", external: { url: "..." } }. Emoji must be an actual emoji character.'),
  cover: z.any().optional().describe('Cover image'),
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
          title?: Array<{ type?: string; text: { content: string } }>
          initial_data_source?: { properties: Record<string, unknown> }
          icon?: { type: string; emoji?: string; external?: { url: string } }
          cover?: { type: string; external: { url: string } }
          is_inline?: boolean
        } = {
          parent: { page_id: parent_page_id },
          initial_data_source: { properties: properties as Record<string, unknown> },
        }

        if (title) {
          params.title = title as Array<{ type?: string; text: { content: string } }>
        }

        if (icon) {
          params.icon = icon as { type: string; emoji?: string; external?: { url: string } }
        }

        if (cover) {
          params.cover = cover as { type: string; external: { url: string } }
        }

        if (is_inline !== undefined) {
          params.is_inline = is_inline
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.databases.create(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
