import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe(F.block_id),
  block: z.record(z.string(), z.any()).describe(F.block),
  archived: z.boolean().optional().describe(F.archived),
}

export function registerUpdateBlock(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-block',
    {
      description:
        'Update a block by its ID. Provide the block type and its properties. ' +
        'Example: { "paragraph": { "rich_text": [{ "text": { "content": "Updated text" } }] } }. ' +
        'Set archived to true to move the block to trash. ' +
        'Returns updated block ID.',
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

        // Return minimal response (id only)
        return formatSimpleResponse({
          id: response.id,
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'block',
        })
      }
    },
  )
}
