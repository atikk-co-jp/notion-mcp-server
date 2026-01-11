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
        'Replace all content of a page with new Markdown content. ' +
        'Automatically preserves child_database and child_page blocks (they will not be deleted). ' +
        'This is useful for bulk updating page content without having to find individual block IDs.',
      inputSchema,
    },
    async ({ page_id, content }) => {
      try {
        // 1. Get all existing blocks
        const existingBlocks = await getAllChildBlocks(notion, page_id)

        // 2. Delete blocks that are not in PRESERVE_TYPES
        const blocksToDelete = existingBlocks.filter(
          (block) => !PRESERVE_TYPES.includes(block.type as (typeof PRESERVE_TYPES)[number]),
        )

        const deletedIds: string[] = []
        for (const block of blocksToDelete) {
          await notion.blocks.delete({ block_id: block.id })
          deletedIds.push(block.id)
        }

        // 3. Convert markdown to blocks
        const newBlocks = markdownToBlocks(content) as unknown as BlockObjectRequest[]

        // 4. Append new blocks
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
