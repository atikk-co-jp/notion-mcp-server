import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  page_id: z.string().describe('Page ID'),
  rich_text: z.array(z.any()).describe('Comment content as rich text'),
  discussion_id: z.string().optional().describe('Reply to existing discussion'),
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
    async ({ page_id, rich_text, discussion_id }) => {
      try {
        // The Notion API requires either parent or discussion_id
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
