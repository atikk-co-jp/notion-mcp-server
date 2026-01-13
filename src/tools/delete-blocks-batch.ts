import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_ids: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe('Block IDs to delete (max 100). Use get-block-children with format="simple" to get IDs.'),
}

export function registerDeleteBlocksBatch(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'delete-blocks-batch',
    {
      description:
        'Delete multiple blocks by their IDs. Use this when you want to delete specific blocks. ' +
        'For deleting all content from a page, use clear-page-content instead. ' +
        'Blocks are deleted sequentially to respect API rate limits (3 req/s). ' +
        'Returns summary of deleted and failed blocks.',
      inputSchema,
    },
    async ({ block_ids }: { block_ids: string[] }) => {
      try {
        const results: { deleted: string[]; failed: Array<{ id: string; error: string }> } = {
          deleted: [],
          failed: [],
        }

        for (const id of block_ids) {
          try {
            await notion.blocks.delete({ block_id: id })
            results.deleted.push(id)
          } catch (e) {
            results.failed.push({
              id,
              error: e instanceof Error ? e.message : String(e),
            })
          }
        }

        return formatSimpleResponse({
          deleted_count: results.deleted.length,
          failed_count: results.failed.length,
          deleted: results.deleted,
          failed: results.failed.length > 0 ? results.failed : undefined,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
