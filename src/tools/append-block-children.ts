import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { type Block, BlockChildrenSchema } from '../schemas/block.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe('The ID of the block or page to append children to'),
  children: BlockChildrenSchema.describe(
    'Array of block objects to append. ' +
      'Supported types: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, code, quote, callout, divider, bookmark, image, video, embed, table_of_contents. ' +
      'Example: [{ "type": "paragraph", "paragraph": { "rich_text": [{ "text": { "content": "Hello" } }] } }]',
  ),
  after: z
    .string()
    .optional()
    .describe(
      'The ID of a block to insert the new children after. ' +
        'If not provided, children are appended at the end.',
    ),
}

export function registerAppendBlockChildren(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'append-block-children',
    {
      description:
        'Append new blocks as children to a block or page. ' +
        'Supports all block types: paragraph, headings, lists, code, images, etc. ' +
        'Returns the created blocks with their IDs. ' +
        'Use the "after" parameter to insert blocks at a specific position.',
      inputSchema,
    },
    async ({ block_id, children, after }) => {
      try {
        const params: {
          block_id: string
          children: Block[]
          after?: string
        } = {
          block_id,
          children: children as Block[],
        }

        if (after) {
          params.after = after
        }

        const response = await notion.blocks.children.append(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
