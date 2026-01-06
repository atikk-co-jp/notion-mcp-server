import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { blocksToMarkdown, blocksToMarkdownSync, type NotionBlock } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatMarkdownResponse, formatPaginatedResponse, handleError } from '../utils/index.js'

interface PaginatedResponse {
  results: NotionBlock[]
  has_more: boolean
  next_cursor: string | null
}

const inputSchema = {
  block_id: z.string().describe('The ID of the block or page to get children from'),
  start_cursor: z
    .string()
    .optional()
    .describe('Cursor for pagination. Use the next_cursor from previous response.'),
  page_size: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of results to return (1-100). Default is 100.'),
  format: z
    .enum(['json', 'markdown'])
    .optional()
    .default('markdown')
    .describe(
      "Output format: 'markdown' (default) returns human-readable text with significantly reduced token usage, 'json' returns raw Notion API response",
    ),
  fetch_nested: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "When format='markdown', fetch nested children blocks recursively (toggle, list items with children, etc.). Default is false.",
    ),
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
        const response = await notion.blocks.children.list<PaginatedResponse>({
          block_id,
          start_cursor,
          page_size,
        })

        if (format === 'markdown') {
          let markdown: string

          if (fetch_nested) {
            // 子ブロックを再帰的に取得
            const fetchChildren = async (blockId: string): Promise<NotionBlock[]> => {
              const res = await notion.blocks.children.list<PaginatedResponse>({
                block_id: blockId,
              })
              return res.results
            }
            markdown = await blocksToMarkdown(response.results, { fetchChildren })
          } else {
            // 子ブロック取得なし（同期版）
            markdown = blocksToMarkdownSync(response.results)
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
