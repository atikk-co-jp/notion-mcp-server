import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  block_id: z.string().describe(F.block_id),
  children: z.array(z.any()).describe(F.children),
  after: z.string().optional().describe(F.after),
}

// Types derived from inputSchema - guaranteed to match
type Input = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> }
type Children = Input['children']

export function registerAppendBlockChildren(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'append-block-children',
    {
      description:
        'Append new blocks as children to a block or page. ' +
        'Supports all block types: paragraph, headings, lists, code, images, etc. ' +
        'Returns the created block IDs. ' +
        'Use the "after" parameter to insert blocks at a specific position.',
      inputSchema,
    },
    async ({ block_id, children, after }) => {
      try {
        const params: {
          block_id: string
          children: Children
          after?: string
        } = {
          block_id,
          children: children as Children,
        }

        if (after) {
          params.after = after
        }

        const response = await notion.blocks.children.append(params)

        // Return minimal response (block_ids only)
        return formatSimpleResponse({
          block_ids: response.results.map((block) => block.id),
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'block',
        })
      }
    },
  )
}
