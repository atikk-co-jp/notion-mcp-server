import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { isFullComment, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatPaginatedResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().optional().describe(F.block_id),
  page_id: z.string().optional().describe(F.page_id),
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().optional().describe(F.page_size),
}

export function registerListComments(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'list-comments',
    {
      description:
        'List comments on a page or block. Either block_id or page_id must be provided. ' +
        'Returns a paginated list of comments with their content and metadata.',
      inputSchema,
    },
    async ({ block_id, page_id, start_cursor, page_size }) => {
      try {
        if (!block_id && !page_id) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: Either block_id or page_id must be provided.',
              },
            ],
            isError: true,
          }
        }

        // Notion API only accepts block_id (page_id works as block_id since pages are blocks)
        // We checked above that at least one is defined, so we can safely use the fallback
        const targetBlockId = block_id ?? page_id ?? ''
        const response = await notion.comments.list({
          block_id: targetBlockId,
          start_cursor,
          page_size,
        })

        // Format comments with essential info (filter to full comments only)
        const comments = response.results.filter(isFullComment).map((comment) => ({
          id: comment.id,
          discussion_id: comment.discussion_id,
          text: comment.rich_text.map((t) => t.plain_text).join(''),
          created_time: comment.created_time,
          created_by: comment.created_by.id,
        }))

        return formatPaginatedResponse(comments, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
