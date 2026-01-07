import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  database_id: z.string().describe('Database ID to archive'),
}

export function registerArchiveDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'archive-database',
    {
      description:
        'Archive (delete) a Notion database by moving it to trash. ' +
        'This is equivalent to update-database with archived: true.',
      inputSchema,
    },
    async ({ database_id }) => {
      try {
        const response = await notion.databases.update({
          database_id,
          archived: true,
        })
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
