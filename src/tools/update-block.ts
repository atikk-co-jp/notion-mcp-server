import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe('Block ID to update'),
  block: z.record(z.string(), z.any()).describe('Block data with type-specific properties'),
  archived: z.boolean().optional().describe('Set to true to archive the block'),
}

export function registerUpdateBlock(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-block',
    {
      description:
        'Update a block by its ID. Provide the block type and its properties. ' +
        'Example: { "paragraph": { "rich_text": [{ "text": { "content": "Updated text" } }] } }. ' +
        'Set archived to true to move the block to trash.',
      inputSchema,
    },
    async ({ block_id, block, archived }) => {
      try {
        const params: { block_id: string; archived?: boolean; [key: string]: unknown } = {
          block_id,
          ...block,
        }

        if (archived !== undefined) {
          params.archived = archived
        }

        const response = await notion.blocks.update(params)
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
