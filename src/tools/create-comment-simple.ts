import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { parseInlineMarkdown } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe('Page ID'),
  content: z.string().describe('Comment in Markdown (**bold**, *italic*, [link](url), `code`)'),
  discussion_id: z.string().optional().describe('Reply to existing thread'),
}

export function registerCreateCommentSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-comment-simple',
    {
      description:
        'Add a comment using Markdown. Simpler than create-comment.',
      inputSchema,
    },
    async ({ page_id, content, discussion_id }) => {
      try {
        const rich_text = parseInlineMarkdown(content)

        const params: {
          parent?: { page_id: string }
          discussion_id?: string
          rich_text: unknown[]
        } = {
          rich_text,
        }

        if (discussion_id) {
          params.discussion_id = discussion_id
        } else {
          params.parent = { page_id }
        }

        const response = await notion.comments.create(
          params as Parameters<typeof notion.comments.create>[0],
        )
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
