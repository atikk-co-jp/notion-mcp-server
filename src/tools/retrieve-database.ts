import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { isFullDatabase, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  database_id: z.string().describe(F.database_id),
  format: z.enum(['json', 'simple']).optional().describe(F.format),
}

export function registerRetrieveDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-database',
    {
      description:
        'Retrieve a database container by its ID. Returns database metadata and associated data sources. ' +
        'Note: In API 2025-09-03, database properties/schema are retrieved via retrieve-data-source using data_source_id. ' +
        "Use format='simple' (default) for reduced token usage, 'json' for full Notion API response.",
      inputSchema,
    },
    async ({ database_id, format = 'simple' }) => {
      try {
        const response = await notion.databases.retrieve({ database_id })

        if (format === 'json') {
          return formatResponse(response)
        }

        // Need full database for simple format
        if (!isFullDatabase(response)) {
          return formatResponse(response)
        }

        // Simple format: extract essential info
        const simpleResponse = {
          id: response.id,
          title: response.title.map((t: { plain_text: string }) => t.plain_text).join(''),
          description: response.description.map((t: { plain_text: string }) => t.plain_text).join(''),
          url: response.url,
          is_inline: response.is_inline,
          in_trash: response.in_trash,
          data_sources: response.data_sources,
          icon: response.icon,
          created_time: response.created_time,
          last_edited_time: response.last_edited_time,
        }

        return formatSimpleResponse(simpleResponse)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
