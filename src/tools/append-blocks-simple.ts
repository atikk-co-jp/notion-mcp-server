import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BlockObjectRequest } from '@notionhq/client'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

// Minimal schema for MCP
const inputSchema = {
  block_id: z.string().describe(F.block_id),
  content: z.string().describe(F.content),
  after: z.string().optional().describe(F.after),
}

export function registerAppendBlocksSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'append-blocks-simple',
    {
      description:
        'Append blocks to a page using Markdown. Simpler than append-block-children: just provide markdown text. ' +
        F.markdown_syntax +
        ' Returns created block IDs.',
      inputSchema,
    },
    async ({ block_id, content, after }) => {
      try {
        // Convert markdown to blocks and cast to SDK type
        const children = markdownToBlocks(content) as unknown as BlockObjectRequest[]

        const response = await notion.blocks.children.append({
          block_id,
          children,
          ...(after && { after }),
        })

        // Return minimal response (block_ids only)
        return formatSimpleResponse({
          block_ids: response.results.map((block) => block.id),
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
