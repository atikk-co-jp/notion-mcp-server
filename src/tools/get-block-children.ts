import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { blocksToMarkdown } from '../converters/index.js'
import { type BlockObjectResponse, isFullBlock, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import {
  formatMarkdownResponse,
  formatPaginatedResponse,
  formatSimpleResponse,
  handleError,
} from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe(F.block_id),
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().min(1).max(100).optional().describe(F.page_size),
  format: z
    .enum(['json', 'markdown', 'simple'])
    .optional()
    .default('markdown')
    .describe(F.format_block_children),
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
            // 子ブロック取得なし
            markdown = await blocksToMarkdown(blocks)
          }

          return formatMarkdownResponse(markdown, response.has_more, response.next_cursor)
        }

        if (format === 'simple') {
          // Simple format: ID + type + markdown content (lightweight, for deletion target selection)
          const simpleBlocks = await Promise.all(
            blocks.map(async (block) => ({
              id: block.id,
              type: block.type,
              content: await blocksToMarkdown([block]),
            })),
          )

          return formatSimpleResponse({
            blocks: simpleBlocks,
            has_more: response.has_more,
            next_cursor: response.next_cursor,
          })
        }

        // JSON形式
        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
