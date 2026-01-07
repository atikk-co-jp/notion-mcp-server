import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe('Page ID to archive'),
}

export function registerArchivePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'archive-page',
    {
      description:
        'Move a page to trash. Recoverable for 30 days via Notion UI.',
      inputSchema,
    },
    async ({ page_id }) => {
      try {
        const response = await notion.pages.update({
          page_id,
          archived: true,
        })
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
