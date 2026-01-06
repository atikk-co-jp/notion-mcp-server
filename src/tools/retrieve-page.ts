import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  blocksToMarkdown,
  type NotionBlock,
  type NotionProperty,
  pageToSimple,
} from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, formatSimpleResponse, handleError } from '../utils/index.js'

interface PageResponse {
  id: string
  url?: string
  properties: Record<string, NotionProperty>
  [key: string]: unknown
}

interface PaginatedBlockResponse {
  results: NotionBlock[]
  has_more: boolean
  next_cursor: string | null
}

const inputSchema = {
  page_id: z.string().describe('The ID of the page to retrieve'),
  format: z
    .enum(['json', 'simple'])
    .optional()
    .default('simple')
    .describe(
      "Output format: 'simple' (default) returns simplified property values with reduced token usage, 'json' returns raw Notion API response",
    ),
  include_content: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Include page content (blocks) as markdown. Default is true. Set to false to only retrieve page properties.',
    ),
}

export function registerRetrievePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-page',
    {
      description:
        "Retrieve a Notion page by its ID. Returns the page properties, metadata, and optionally content (blocks as markdown). Use format='simple' (default) for human-readable output with reduced token usage.",
      inputSchema,
    },
    async ({ page_id, format, include_content }) => {
      try {
        const response = await notion.pages.retrieve<PageResponse>({ page_id })

        // コンテンツを取得
        let content: string | undefined
        if (include_content) {
          const blocksResponse = await notion.blocks.children.list<PaginatedBlockResponse>({
            block_id: page_id,
          })

          // 子ブロックを再帰的に取得するヘルパー
          const fetchChildren = async (blockId: string): Promise<NotionBlock[]> => {
            const res = await notion.blocks.children.list<PaginatedBlockResponse>({
              block_id: blockId,
            })
            return res.results
          }

          content = await blocksToMarkdown(blocksResponse.results, { fetchChildren })
        }

        if (format === 'simple') {
          const simple = pageToSimple(response)
          if (content !== undefined) {
            return formatSimpleResponse({ ...simple, content })
          }
          return formatSimpleResponse(simple)
        }

        // JSON形式
        if (content !== undefined) {
          return formatResponse({ ...response, content })
        }
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
