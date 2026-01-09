import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { parseInlineMarkdown } from '../converters/index.js'
import { isFullBlock, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  block_id: z.string().describe(F.block_id),
  content: z.string().describe(F.content),
}

// Supported block types for simple update
const SUPPORTED_TYPES = [
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
  'quote',
  'callout',
  'toggle',
] as const

type SupportedBlockType = (typeof SUPPORTED_TYPES)[number]

export function registerUpdateBlockSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'update-block-simple',
    {
      description:
        'Update a text block using Markdown. Simpler than update-block: just provide markdown text. ' +
        'Supports inline formatting: **bold**, *italic*, ~~strikethrough~~, `code`, [links](url). ' +
        'Only works with text-based blocks: paragraph, headings, lists, to_do, quote, callout, toggle.',
      inputSchema,
    },
    async ({ block_id, content }) => {
      try {
        // First, retrieve the block to get its type
        const existingBlock = await notion.blocks.retrieve({ block_id })

        if (!isFullBlock(existingBlock)) {
          return {
            content: [
              { type: 'text' as const, text: 'Error: Could not retrieve full block details.' },
            ],
            isError: true,
          }
        }

        const blockType = existingBlock.type as SupportedBlockType

        if (!SUPPORTED_TYPES.includes(blockType)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error: Block type "${blockType}" is not supported for simple update. Supported types: ${SUPPORTED_TYPES.join(', ')}`,
              },
            ],
            isError: true,
          }
        }

        // Parse markdown to rich_text
        const richText = parseInlineMarkdown(content)

        // Build the update params based on block type
        const params: { block_id: string; [key: string]: unknown } = {
          block_id,
        }

        if (blockType === 'to_do' && existingBlock.type === 'to_do') {
          // Preserve the checked state for to_do blocks
          params[blockType] = {
            rich_text: richText,
            checked: existingBlock.to_do.checked ?? false,
          }
        } else {
          params[blockType] = {
            rich_text: richText,
          }
        }

        const response = await notion.blocks.update(params)

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
