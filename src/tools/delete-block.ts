import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe(F.block_id),
}

export function registerDeleteBlock(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'delete-block',
    {
      description:
        'Delete a block by its ID. The block will be archived (moved to trash). ' +
        'Returns deleted block ID.',
      inputSchema,
    },
    async ({ block_id }) => {
      try {
        const response = await notion.blocks.delete({ block_id })

        // Return minimal response (id only)
        return formatSimpleResponse({
          id: response.id,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
