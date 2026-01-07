import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe('Page ID to move'),
  parent: z
    .object({
      page_id: z.string().optional().describe('Target parent page ID'),
      data_source_id: z.string().optional().describe('Target data source ID'),
    })
    .describe('New parent (provide either page_id or data_source_id)'),
}

export function registerMovePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'move-page',
    {
      description:
        'Move a page to a new parent (page or data source). ' +
        'Provide either page_id or data_source_id as the new parent. ' +
        '(API version 2025-09-03)',
      inputSchema,
    },
    async ({ page_id, parent }) => {
      try {
        if (!parent.page_id && !parent.data_source_id) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: Parent must have either page_id or data_source_id.',
              },
            ],
            isError: true,
          }
        }

        const parentParam = parent.page_id
          ? { page_id: parent.page_id }
          : { data_source_id: parent.data_source_id as string }

        const response = await notion.pages.move({
          page_id,
          parent: parentParam,
        })

        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
