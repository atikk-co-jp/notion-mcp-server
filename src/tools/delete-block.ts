import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe('Block ID to delete'),
}

export function registerDeleteBlock(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'delete-block',
    {
      description:
        'Delete a block by its ID. The block will be archived (moved to trash). ' +
        'Returns the archived block object.',
      inputSchema,
    },
    async ({ block_id }) => {
      try {
        const response = await notion.blocks.delete({ block_id })
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
