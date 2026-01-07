import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { blocksToMarkdownSync } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatMarkdownResponse, formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe('Block ID to retrieve'),
  format: z
    .enum(['markdown', 'json'])
    .optional()
    .describe("Output format: 'markdown' (default) or 'json'"),
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
        const response = await notion.blocks.retrieve<{ type: string; [key: string]: unknown }>({
          block_id,
        })

        if (format === 'json') {
          return formatResponse(response)
        }

        // Convert to markdown
        const markdown = blocksToMarkdownSync([response])
        return formatMarkdownResponse(markdown, false, null)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
