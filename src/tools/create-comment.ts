import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { RichTextArraySchema } from '../schemas/common.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe('The ID of the page to add a comment to'),
  rich_text: RichTextArraySchema.describe(
    'The comment content as rich text array. ' +
      'Each item: { "type": "text", "text": { "content": "..." }, "annotations": { "bold": true, ... } }. ' +
      'Example: [{ "type": "text", "text": { "content": "This is a comment" } }]',
  ),
  discussion_id: z
    .string()
    .optional()
    .describe(
      'Optional ID of an existing discussion to add the comment to. ' +
        'If not provided, a new discussion is created.',
    ),
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
