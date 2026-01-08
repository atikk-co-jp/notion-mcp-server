import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  blocksToMarkdown,
  pageToSimple,
} from '../converters/index.js'
import { type BlockObjectResponse, isFullBlock, isFullPage, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatResponse, formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe(F.page_id),
  format: z.enum(['json', 'simple']).optional().default('simple').describe(F.format),
  include_content: z.boolean().optional().default(true).describe(F.include_content),
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
        const response = await notion.pages.retrieve({ page_id })

        // コンテンツを取得
        let content: string | undefined
        if (include_content) {
          const blocksResponse = await notion.blocks.children.list({ block_id: page_id })

          // Filter to full blocks
          const blocks = blocksResponse.results.filter(isFullBlock)

          // 子ブロックを再帰的に取得するヘルパー
          const fetchChildren = async (blockId: string): Promise<BlockObjectResponse[]> => {
            const res = await notion.blocks.children.list({ block_id: blockId })
            return res.results.filter(isFullBlock)
          }

          content = await blocksToMarkdown(blocks, { fetchChildren })
        }

        if (format === 'simple') {
          if (!isFullPage(response)) {
            return formatResponse(response)
          }
          const simple = pageToSimple(response as unknown as Parameters<typeof pageToSimple>[0])
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
