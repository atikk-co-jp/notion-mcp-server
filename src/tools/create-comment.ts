import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  page_id: z.string().optional().describe(F.page_id),
  block_id: z.string().optional().describe(F.block_id),
  discussion_id: z.string().optional().describe(F.discussion_id),
  rich_text: z.array(z.any()).describe(F.rich_text),
}

export function registerCreateComment(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-comment',
    {
      description:
        'Add a comment to a Notion page. Creates a new discussion or adds to an existing one. ' +
        'Comments support rich text formatting (bold, italic, links, etc.). ' +
        'Use discussion_id to reply to an existing comment thread. ' +
        'Returns the created comment with its ID.',
      inputSchema,
    },
    async ({ page_id, block_id, discussion_id, rich_text }) => {
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
        return handleErrorWithContext(error, notion, {
          exampleType: 'richTextArray',
        })
      }
    },
  )
}
