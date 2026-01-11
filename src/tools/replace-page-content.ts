import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BlockObjectRequest, BlockObjectResponse } from '@notionhq/client'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe(F.page_id),
  content: z.string().describe(F.content),
  dry_run: z
    .boolean()
    .optional()
    .describe(
      'Preview mode: shows which blocks will be deleted without actually modifying the page (default: false)',
    ),
}

// Block types to preserve (not delete)
const PRESERVE_TYPES = ['child_database', 'child_page'] as const

/**
 * Get all child blocks of a page (handles pagination)
 */
async function getAllChildBlocks(
  notion: NotionClient,
  pageId: string,
): Promise<BlockObjectResponse[]> {
  const allBlocks: BlockObjectResponse[] = []
  let cursor: string | undefined

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    })

    for (const block of response.results) {
      if ('type' in block) {
        allBlocks.push(block as BlockObjectResponse)
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  return allBlocks
}

export function registerReplacePageContent(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'replace-page-content',
    {
      description:
        'Replace all page content with Markdown. Preserves child_database/child_page only. ' +
        'WARNING: Non-Markdown blocks (bookmark, callout, equation, etc.) will be DELETED. ' +
        'Use dry_run: true to preview deletions. For partial updates, use find-and-replace-in-page.',
      inputSchema,
    },
    async ({ page_id, content, dry_run }) => {
      try {
        const isDryRun = dry_run ?? false

        // 1. Get all existing blocks
        const existingBlocks = await getAllChildBlocks(notion, page_id)

        // 2. Identify blocks to delete (not in PRESERVE_TYPES)
        const blocksToDelete = existingBlocks.filter(
          (block) => !PRESERVE_TYPES.includes(block.type as (typeof PRESERVE_TYPES)[number]),
        )

        // 3. Identify blocks to preserve
        const blocksToPreserve = existingBlocks.filter((block) =>
          PRESERVE_TYPES.includes(block.type as (typeof PRESERVE_TYPES)[number]),
        )

        // If dry_run, return preview without making changes
        if (isDryRun) {
          // Group blocks by type for readable output
          const deleteByType: Record<string, number> = {}
          for (const block of blocksToDelete) {
            deleteByType[block.type] = (deleteByType[block.type] ?? 0) + 1
          }

          const preserveByType: Record<string, number> = {}
          for (const block of blocksToPreserve) {
            preserveByType[block.type] = (preserveByType[block.type] ?? 0) + 1
          }

          return formatSimpleResponse({
            dry_run: true,
            will_delete_count: blocksToDelete.length,
            will_delete_by_type: deleteByType,
            will_preserve_count: blocksToPreserve.length,
            will_preserve_by_type: preserveByType,
            message: 'No changes made. Set dry_run: false to execute.',
          })
        }

        // 4. Actually delete blocks
        const deletedIds: string[] = []
        for (const block of blocksToDelete) {
          await notion.blocks.delete({ block_id: block.id })
          deletedIds.push(block.id)
        }

        // 5. Convert markdown to blocks
        const newBlocks = markdownToBlocks(content) as unknown as BlockObjectRequest[]

        // 6. Append new blocks
        const appendResponse = await notion.blocks.children.append({
          block_id: page_id,
          children: newBlocks,
        })

        const createdIds = appendResponse.results.map((block) => block.id)

        // Return minimal response
        return formatSimpleResponse({
          deleted_count: deletedIds.length,
          created_count: createdIds.length,
          preserved_types: PRESERVE_TYPES,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
