import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { blocksToMarkdown, blocksToMarkdownSync } from '../converters/index.js'
import { type BlockObjectResponse, isFullBlock, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatMarkdownResponse, formatPaginatedResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe(F.block_id),
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().min(1).max(100).optional().describe(F.page_size),
  format: z.enum(['json', 'markdown']).optional().default('markdown').describe(F.format),
  fetch_nested: z.boolean().optional().default(false).describe(F.fetch_nested),
}

export function registerGetBlockChildren(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'get-block-children',
    {
      description:
        "Retrieve the children blocks of a block or page. Returns paginated results. Use format='markdown' (default) for human-readable output with significantly reduced token usage.",
      inputSchema,
    },
    async ({ block_id, start_cursor, page_size, format, fetch_nested }) => {
      try {
        const response = await notion.blocks.children.list({
          block_id,
          start_cursor,
          page_size,
        })

        // Filter to full blocks
        const blocks = response.results.filter(isFullBlock)

        if (format === 'markdown') {
          let markdown: string

          if (fetch_nested) {
            // 子ブロックを再帰的に取得
            const fetchChildren = async (blockId: string): Promise<BlockObjectResponse[]> => {
              const res = await notion.blocks.children.list({ block_id: blockId })
              return res.results.filter(isFullBlock)
            }
            markdown = await blocksToMarkdown(blocks, { fetchChildren })
          } else {
            // 子ブロック取得なし（同期版）
            markdown = blocksToMarkdownSync(blocks)
          }

          return formatMarkdownResponse(markdown, response.has_more, response.next_cursor)
        }

        // JSON形式
        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
