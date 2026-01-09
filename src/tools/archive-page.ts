import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe(F.page_id),
}

export function registerArchivePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'archive-page',
    {
      description: 'Move a page to trash. Recoverable for 30 days via Notion UI. Returns page ID.',
      inputSchema,
    },
    async ({ page_id }) => {
      try {
        const response = await notion.pages.update({
          page_id,
          archived: true,
        })

        // Return minimal response (id only)
        return formatSimpleResponse({
          id: response.id,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
