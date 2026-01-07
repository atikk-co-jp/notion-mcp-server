import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { parseInlineMarkdown } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().optional().describe('Page ID (for page comments)'),
  block_id: z.string().optional().describe('Block ID (for block comments)'),
  discussion_id: z.string().optional().describe('Discussion ID (for replies)'),
  content: z.string().describe('Comment in Markdown (**bold**, *italic*, [link](url), `code`)'),
}

export function registerCreateCommentSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-comment-simple',
    {
      description: 'Add a comment using Markdown. Simpler than create-comment.',
      inputSchema,
    },
    async ({ page_id, block_id, discussion_id, content }) => {
      try {
        // Validate: exactly one of page_id, block_id, or discussion_id must be provided
        const providedCount = [page_id, block_id, discussion_id].filter(Boolean).length
        if (providedCount !== 1) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: Provide exactly one of page_id, block_id, or discussion_id.',
              },
            ],
            isError: true,
          }
        }

        const rich_text = parseInlineMarkdown(content)

        // Build params based on which ID was provided
        const params: {
          parent?: { page_id: string } | { block_id: string }
          discussion_id?: string
          rich_text: unknown[]
        } = {
          rich_text,
        }

        if (discussion_id) {
          params.discussion_id = discussion_id
        } else if (page_id) {
          params.parent = { page_id }
        } else if (block_id) {
          params.parent = { block_id }
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
