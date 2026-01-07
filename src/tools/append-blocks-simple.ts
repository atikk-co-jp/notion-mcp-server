import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

// Minimal schema for MCP
const inputSchema = {
  block_id: z.string().describe('Page or block ID to append to'),
  content: z.string().describe('Content in Markdown'),
  after: z.string().optional().describe('Insert after this block ID'),
}

export function registerAppendBlocksSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'append-blocks-simple',
    {
      description:
        'Append blocks to a page using Markdown. ' +
        'Simpler than append-block-children: just provide markdown text. ' +
        'Supports: headings (#), lists (- or 1.), checkboxes (- [ ]), code blocks (```), quotes (>), images (![]()), bold (**), italic (*), links ([]()), etc.',
      inputSchema,
    },
    async ({ block_id, content, after }) => {
      try {
        // Convert markdown to blocks
        const children = markdownToBlocks(content)

        // Build params
        const params: {
          block_id: string
          children: unknown[]
          after?: string
        } = {
          block_id,
          children,
        }

        if (after) {
          params.after = after
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.blocks.children.append(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
