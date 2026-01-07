import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatPaginatedResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().optional().describe('Block ID to get comments from'),
  page_id: z
    .string()
    .optional()
    .describe('Page ID to get comments from (use either block_id or page_id)'),
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().optional().describe('Number of results (1-100)'),
}

interface CommentResponse {
  object: 'list'
  results: Array<{
    object: 'comment'
    id: string
    discussion_id: string
    created_time: string
    last_edited_time: string
    created_by: { id: string }
    rich_text: Array<{ plain_text: string }>
    parent: { type: 'page_id' | 'block_id'; page_id?: string; block_id?: string }
  }>
  next_cursor: string | null
  has_more: boolean
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
        const response = await notion.comments.list<CommentResponse>({
          block_id: block_id || page_id,
          start_cursor,
          page_size,
        })

        // Format comments with essential info
        const comments = response.results.map((comment) => ({
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
