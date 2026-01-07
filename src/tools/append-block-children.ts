import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import type { Block } from '../schemas/block.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  block_id: z.string().describe('Block or page ID'),
  children: z.array(z.any()).describe('Block objects to append'),
  after: z.string().optional().describe('Insert after this block ID'),
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
        return handleErrorWithContext(error, notion, {
          exampleType: 'block',
        })
      }
    },
  )
}
