import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { isFullBlock, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe(F.page_id),
  preserve_types: z
    .array(z.string())
    .optional()
    .describe(
      'Block types to preserve (default: ["child_database", "child_page"]). Set to empty array [] to delete all.',
    ),
}

export function registerClearPageContent(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'clear-page-content',
    {
      description:
        'Delete all content from a page. By default, preserves child_database and child_page blocks. ' +
        'Use preserve_types=[] to delete everything. ' +
        'For deleting specific blocks, use delete-blocks-batch instead. ' +
        'Blocks are deleted sequentially to respect API rate limits (3 req/s). ' +
        'Returns count of deleted blocks.',
      inputSchema,
    },
    async ({
      page_id,
      preserve_types = ['child_database', 'child_page'],
    }: {
      page_id: string
      preserve_types?: string[]
    }) => {
      try {
        // Collect all blocks to delete (handle pagination)
        const blocksToDelete: string[] = []
        let cursor: string | undefined

        do {
          const response = await notion.blocks.children.list({
            block_id: page_id,
            start_cursor: cursor,
          })

          const blocks = response.results.filter(isFullBlock)

          for (const block of blocks) {
            if (!preserve_types.includes(block.type)) {
              blocksToDelete.push(block.id)
            }
          }

          cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
        } while (cursor)

        // Delete blocks
        let deleted = 0
        const failed: Array<{ id: string; error: string }> = []

        for (const id of blocksToDelete) {
          try {
            await notion.blocks.delete({ block_id: id })
            deleted++
          } catch (e) {
            failed.push({
              id,
              error: e instanceof Error ? e.message : String(e),
            })
          }
        }

        return formatSimpleResponse({
          deleted_count: deleted,
          failed_count: failed.length,
          failed: failed.length > 0 ? failed : undefined,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
