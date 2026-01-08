import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  database_id: z.string().describe(F.database_id),
}

export function registerArchiveDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'archive-database',
    {
      description: 'Move a database to trash. Recoverable for 30 days via Notion UI.',
      inputSchema,
    },
    async ({ database_id }) => {
      try {
        const response = await notion.databases.update({
          database_id,
          in_trash: true,
        })
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
