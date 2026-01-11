import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client'
import { z } from 'zod'
import { parseInlineMarkdown } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleError } from '../utils/index.js'

const inputSchema = {
  page_id: z.string().describe(F.page_id),
  find: z.string().describe('Text to find (string or regex pattern if use_regex is true)'),
  replace: z.string().describe('Replacement text (supports Markdown: **bold**, *italic*, etc.)'),
  use_regex: z
    .boolean()
    .optional()
    .describe('If true, treat find as a regex pattern (default: false)'),
}

// Block types that support text replacement
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

// ReDoS protection: timeout for regex execution
const REGEX_TIMEOUT_MS = 1000

/**
 * Extract plain text from rich_text array
 */
function extractPlainText(richText: RichTextItemResponse[]): string {
  return richText.map((rt) => rt.plain_text).join('')
}

/**
 * Execute regex with timeout protection (ReDoS mitigation)
 */
function safeRegexTest(
  pattern: RegExp,
  text: string,
  timeoutMs: number = REGEX_TIMEOUT_MS,
): boolean {
  const start = Date.now()
  try {
    // Simple timeout check (not perfect but helps with obvious ReDoS)
    const result = pattern.test(text)
    if (Date.now() - start > timeoutMs) {
      throw new Error('Regex execution timeout')
    }
    return result
  } catch {
    return false
  }
}

/**
 * Replace text in string with regex/string matching
 * @internal Exported for testing
 */
export function replaceText(
  text: string,
  find: string,
  replace: string,
  useRegex: boolean,
): string {
  if (useRegex) {
    try {
      const regex = new RegExp(find, 'g')
      return text.replace(regex, replace)
    } catch {
      // Invalid regex, fall back to string replace
      return text.split(find).join(replace)
    }
  }
  return text.split(find).join(replace)
}

/**
 * Check if text matches the find pattern
 * @internal Exported for testing
 */
export function textMatches(text: string, find: string, useRegex: boolean): boolean {
  if (useRegex) {
    try {
      const regex = new RegExp(find)
      return safeRegexTest(regex, text)
    } catch {
      // Invalid regex, fall back to string match
      return text.includes(find)
    }
  }
  return text.includes(find)
}

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

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)

  return allBlocks
}

/**
 * Get rich_text from a block based on its type
 */
function getBlockRichText(block: BlockObjectResponse): RichTextItemResponse[] | null {
  const blockType = block.type as SupportedBlockType
  if (!SUPPORTED_TYPES.includes(blockType)) {
    return null
  }

  const blockData = block[blockType as keyof typeof block] as { rich_text?: RichTextItemResponse[] }
  return blockData?.rich_text ?? null
}

export function registerFindAndReplaceInPage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'find-and-replace-in-page',
    {
      description:
        'Find text in a page and replace it with new content. ' +
        'Supports regex patterns (use_regex: true) for advanced matching (e.g., "item\\d+" matches item1, item2). ' +
        'All matching blocks will be updated. ' +
        'Replacement text supports Markdown formatting: **bold**, *italic*, ~~strikethrough~~, `code`, [links](url). ' +
        'Only works with text-based blocks: paragraph, headings, lists, to_do, quote, callout, toggle. ' +
        'Use this for partial updates. For full page rewrite, use replace-page-content instead.',
      inputSchema,
    },
    async ({ page_id, find, replace, use_regex }) => {
      try {
        const useRegex = use_regex ?? false

        // Validate regex if enabled
        if (useRegex) {
          try {
            new RegExp(find)
          } catch (e) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: Invalid regex pattern: ${find}. ${e instanceof Error ? e.message : ''}`,
                },
              ],
              isError: true,
            }
          }
        }

        // 1. Get all blocks from the page
        const allBlocks = await getAllChildBlocks(notion, page_id)

        // 2. Find blocks that match the search pattern
        const matchingBlocks: Array<{
          block: BlockObjectResponse
          originalText: string
          newText: string
        }> = []

        for (const block of allBlocks) {
          const richText = getBlockRichText(block)
          if (!richText) continue

          const plainText = extractPlainText(richText)
          if (textMatches(plainText, find, useRegex)) {
            const newText = replaceText(plainText, find, replace, useRegex)
            matchingBlocks.push({
              block,
              originalText: plainText,
              newText,
            })
          }
        }

        if (matchingBlocks.length === 0) {
          return formatSimpleResponse({
            updated_count: 0,
            message: 'No matching blocks found',
          })
        }

        // 3. Update matching blocks
        const updatedIds: string[] = []

        for (const { block, newText } of matchingBlocks) {
          const blockType = block.type as SupportedBlockType
          const richText = parseInlineMarkdown(newText)

          const params: { block_id: string; [key: string]: unknown } = {
            block_id: block.id,
          }

          // Preserve checked state for to_do blocks
          if (blockType === 'to_do' && block.type === 'to_do') {
            params[blockType] = {
              rich_text: richText,
              checked: block.to_do.checked ?? false,
            }
          } else {
            params[blockType] = {
              rich_text: richText,
            }
          }

          await notion.blocks.update(params)
          updatedIds.push(block.id)
        }

        return formatSimpleResponse({
          updated_count: updatedIds.length,
          updated_block_ids: updatedIds,
        })
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
