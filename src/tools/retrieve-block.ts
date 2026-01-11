import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { blocksToMarkdown } from '../converters/index.js'
import { type BlockObjectResponse, isFullBlock, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatMarkdownResponse, formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe(F.block_id),
  format: z.enum(['markdown', 'json']).optional().describe(F.format),
}

export function registerRetrieveBlock(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-block',
    {
      description:
        'Retrieve a single block by its ID. Returns block content and metadata. ' +
        "Use format='markdown' (default) for human-readable output, 'json' for full Notion API response.",
      inputSchema,
    },
    async ({ block_id, format = 'markdown' }) => {
      try {
        const response = await notion.blocks.retrieve({ block_id })

        if (format === 'json') {
          return formatResponse(response)
        }

        // Need full block for markdown conversion
        if (!isFullBlock(response)) {
          return formatResponse(response)
        }

        // 子ブロックを再帰的に取得するヘルパー
        const fetchChildren = async (blockId: string): Promise<BlockObjectResponse[]> => {
          const res = await notion.blocks.children.list({ block_id: blockId })
          return res.results.filter(isFullBlock)
        }

        // Convert to markdown with children fetching
        const markdown = await blocksToMarkdown(
          [response as unknown as BlockObjectResponse],
          { fetchChildren },
        )
        return formatMarkdownResponse(markdown, false, null)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
