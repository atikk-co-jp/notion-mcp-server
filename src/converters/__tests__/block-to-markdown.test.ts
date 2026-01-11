import { describe, expect, it, vi } from 'vitest'
import type { BlockObjectResponse } from '../../notion-client.js'
import { blocksToMarkdown } from '../block-to-markdown.js'

/**
 * テスト用のブロックデータをBlockObjectResponse[]にキャストするヘルパー
 * SDK の BlockObjectResponse は多くの必須フィールド（id, created_time等）を要求するため、
 * テストでは最小限のデータで unknown 経由でキャストして使用
 */
const asBlocks = (blocks: unknown[]): BlockObjectResponse[] =>
  blocks as unknown as BlockObjectResponse[]

describe('blocksToMarkdown', async () => {
  describe('basic blocks', async () => {
    it('converts paragraph block', async () => {
      const blocks = asBlocks([
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: 'Hello World' }, plain_text: 'Hello World' },
            ],
            color: 'default',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('Hello World')
    })

    it('handles empty paragraph', async () => {
      const blocks = asBlocks([
        {
          type: 'paragraph',
          paragraph: { rich_text: [], color: 'default' },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('')
    })

    it('handles empty array', async () => {
      expect(await blocksToMarkdown([])).toBe('')
    })

    it('handles undefined input', async () => {
      expect(await blocksToMarkdown(undefined as unknown as BlockObjectResponse[])).toBe('')
    })
  })

  describe('headings', async () => {
    it('converts heading_1', async () => {
      const blocks = asBlocks([
        {
          type: 'heading_1',
          heading_1: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Heading 1' },
                plain_text: 'Heading 1',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('# Heading 1')
    })

    it('converts heading_2', async () => {
      const blocks = asBlocks([
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Heading 2' },
                plain_text: 'Heading 2',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('## Heading 2')
    })

    it('converts heading_3', async () => {
      const blocks = asBlocks([
        {
          type: 'heading_3',
          heading_3: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Heading 3' },
                plain_text: 'Heading 3',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('### Heading 3')
    })
  })

  describe('list items', async () => {
    it('converts bulleted_list_item', async () => {
      const blocks = asBlocks([
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Item 1' },
                plain_text: 'Item 1',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
        {
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Item 2' },
                plain_text: 'Item 2',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('- Item 1\n- Item 2')
    })

    it('converts numbered_list_item with correct indices', async () => {
      const blocks = asBlocks([
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'First' },
                plain_text: 'First',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Second' },
                plain_text: 'Second',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Third' },
                plain_text: 'Third',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('1. First\n2. Second\n3. Third')
    })

    it('resets numbered list index after non-list block', async () => {
      const blocks = asBlocks([
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'First' },
                plain_text: 'First',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Break' },
                plain_text: 'Break',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
        {
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'New First' },
                plain_text: 'New First',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('1. First\nBreak\n1. New First')
    })
  })

  describe('to_do', async () => {
    it('converts unchecked to_do', async () => {
      const blocks = asBlocks([
        {
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Task' },
                plain_text: 'Task',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
            checked: false,
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('- [ ] Task')
    })

    it('converts checked to_do', async () => {
      const blocks = asBlocks([
        {
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Done Task' },
                plain_text: 'Done Task',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
            checked: true,
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('- [x] Done Task')
    })
  })

  describe('code block', async () => {
    it('converts code block with language', async () => {
      const blocks = asBlocks([
        {
          type: 'code',
          code: {
            rich_text: [
              {
                type: 'text',
                text: { content: "console.log('hello')" },
                plain_text: "console.log('hello')",
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
            language: 'javascript',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe("```javascript\nconsole.log('hello')\n```")
    })

    it('converts code block without language', async () => {
      const blocks = asBlocks([
        {
          type: 'code',
          code: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'plain code' },
                plain_text: 'plain code',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
            language: '',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('```\nplain code\n```')
    })
  })

  describe('quote and callout', async () => {
    it('converts quote', async () => {
      const blocks = asBlocks([
        {
          type: 'quote',
          quote: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'A wise quote' },
                plain_text: 'A wise quote',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('> A wise quote')
    })

    it('converts multiline quote', async () => {
      const blocks = asBlocks([
        {
          type: 'quote',
          quote: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Line 1\nLine 2' },
                plain_text: 'Line 1\nLine 2',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('> Line 1\n> Line 2')
    })

    it('converts callout with emoji icon', async () => {
      const blocks = asBlocks([
        {
          type: 'callout',
          callout: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Important info' },
                plain_text: 'Important info',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
            icon: { type: 'emoji', emoji: '💡' },
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('> [!TIP]\n> Important info')
    })

    it('converts callout without icon', async () => {
      const blocks = asBlocks([
        {
          type: 'callout',
          callout: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Info' },
                plain_text: 'Info',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
            icon: null,
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('> [!NOTE]\n> Info')
    })
  })

  describe('divider', async () => {
    it('converts divider', async () => {
      const blocks = asBlocks([{ type: 'divider', divider: {} }])
      expect(await blocksToMarkdown(blocks)).toBe('---')
    })
  })

  describe('bookmark and links', async () => {
    it('converts bookmark', async () => {
      const blocks = asBlocks([
        {
          type: 'bookmark',
          bookmark: {
            url: 'https://example.com',
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('[bookmark](https://example.com)')
    })

    it('converts bookmark with caption', async () => {
      const blocks = asBlocks([
        {
          type: 'bookmark',
          bookmark: {
            url: 'https://example.com',
            caption: [
              {
                type: 'text',
                text: { content: 'Example Site' },
                plain_text: 'Example Site',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('[bookmark:Example Site](https://example.com)')
    })

    it('converts link_preview', async () => {
      const blocks = asBlocks([
        {
          type: 'link_preview',
          link_preview: {
            url: 'https://example.com/preview',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe(
        '[https://example.com/preview](https://example.com/preview)',
      )
    })
  })

  describe('media blocks', async () => {
    it('converts image with external url', async () => {
      const blocks = asBlocks([
        {
          type: 'image',
          image: {
            type: 'external',
            external: { url: 'https://example.com/image.png' },
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('![](https://example.com/image.png)')
    })

    it('converts image with caption', async () => {
      const blocks = asBlocks([
        {
          type: 'image',
          image: {
            type: 'external',
            external: { url: 'https://example.com/image.png' },
            caption: [
              {
                type: 'text',
                text: { content: 'My Image' },
                plain_text: 'My Image',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('![My Image](https://example.com/image.png)')
    })

    it('converts image with file url', async () => {
      const blocks = asBlocks([
        {
          type: 'image',
          image: {
            type: 'file',
            file: { url: 'https://s3.amazonaws.com/file.png' },
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('![](https://s3.amazonaws.com/file.png)')
    })

    it('converts video', async () => {
      const blocks = asBlocks([
        {
          type: 'video',
          video: {
            type: 'external',
            external: { url: 'https://youtube.com/watch?v=123' },
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('@[video](https://youtube.com/watch?v=123)')
    })

    it('converts audio', async () => {
      const blocks = asBlocks([
        {
          type: 'audio',
          audio: {
            type: 'external',
            external: { url: 'https://example.com/audio.mp3' },
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('@[audio](https://example.com/audio.mp3)')
    })

    it('converts file', async () => {
      const blocks = asBlocks([
        {
          type: 'file',
          file: {
            type: 'file',
            file: { url: 'https://example.com/doc.pdf' },
            name: 'Document',
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('@[file:Document](https://example.com/doc.pdf)')
    })

    it('converts pdf', async () => {
      const blocks = asBlocks([
        {
          type: 'pdf',
          pdf: {
            type: 'external',
            external: { url: 'https://example.com/doc.pdf' },
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('@[pdf](https://example.com/doc.pdf)')
    })

    it('converts embed', async () => {
      const blocks = asBlocks([
        {
          type: 'embed',
          embed: {
            url: 'https://codepen.io/pen/123',
            caption: [],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('@[embed](https://codepen.io/pen/123)')
    })
  })

  describe('toggle', async () => {
    it('converts toggle block', async () => {
      const blocks = asBlocks([
        {
          type: 'toggle',
          toggle: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Click to expand' },
                plain_text: 'Click to expand',
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                href: null,
              },
            ],
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe(
        '<details>\n<summary>Click to expand</summary>\n</details>',
      )
    })
  })

  describe('special blocks', async () => {
    it('converts table_of_contents', async () => {
      const blocks = asBlocks([
        {
          type: 'table_of_contents',
          table_of_contents: { color: 'default' },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('[TOC]')
    })

    it('converts equation', async () => {
      const blocks = asBlocks([
        {
          type: 'equation',
          equation: {
            expression: 'E = mc^2',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('$$\nE = mc^2\n$$')
    })

    it('converts child_page', async () => {
      const blocks = asBlocks([
        {
          type: 'child_page',
          child_page: {
            title: 'My Subpage',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('📄 [My Subpage]')
    })

    it('converts child_database', async () => {
      const blocks = asBlocks([
        {
          type: 'child_database',
          child_database: {
            title: 'My Database',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('📊 [My Database]')
    })
  })

  describe('unsupported blocks', async () => {
    it('handles unsupported block type', async () => {
      const blocks = asBlocks([
        {
          type: 'unsupported',
          unsupported: {},
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('<!-- Unsupported block type: unsupported -->')
    })
  })

  describe('breadcrumb block', async () => {
    it('converts breadcrumb to HTML comment', async () => {
      const blocks = asBlocks([
        {
          type: 'breadcrumb',
          breadcrumb: {},
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('<!-- Breadcrumb -->')
    })
  })

  describe('link_to_page block', async () => {
    it('converts link_to_page with page_id', async () => {
      const blocks = asBlocks([
        {
          type: 'link_to_page',
          link_to_page: {
            type: 'page_id',
            page_id: 'abc123-page-id',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('[Link to page](abc123-page-id)')
    })

    it('converts link_to_page with database_id', async () => {
      const blocks = asBlocks([
        {
          type: 'link_to_page',
          link_to_page: {
            type: 'database_id',
            database_id: 'xyz789-db-id',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('[Link to database](xyz789-db-id)')
    })

    it('converts link_to_page with unknown type to HTML comment', async () => {
      const blocks = asBlocks([
        {
          type: 'link_to_page',
          link_to_page: {
            type: 'comment_id',
            comment_id: 'comment-123',
          },
        },
      ])
      expect(await blocksToMarkdown(blocks)).toBe('<!-- Link to page -->')
    })
  })

  describe('real world data', async () => {
    it('converts actual Notion block data', async () => {
      // 実際のNotionから取得したデータ形式
      const blocks = asBlocks([
        {
          object: 'block',
          id: 'f542c96d-5d08-4488-83a0-ec2bb4af3d10',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content: '問題', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                plain_text: '問題',
                href: null,
              },
            ],
            is_toggleable: false,
            color: 'default',
          },
        },
        {
          object: 'block',
          id: '8c7f084b-e946-4456-a85b-1bd160ffed9a',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: '以下のパッケージで ', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                plain_text: '以下のパッケージで ',
                href: null,
              },
              {
                type: 'text',
                text: { content: 'exports', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: true,
                  color: 'default',
                },
                plain_text: 'exports',
                href: null,
              },
              {
                type: 'text',
                text: { content: ' が必要：', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: false,
                  color: 'default',
                },
                plain_text: ' が必要：',
                href: null,
              },
            ],
            color: 'default',
          },
        },
        {
          object: 'block',
          id: 'cde242b1-9b0c-47f4-af8e-29122bd1f048',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'apps/supabase-client/package.json', link: null },
                annotations: {
                  bold: false,
                  italic: false,
                  strikethrough: false,
                  underline: false,
                  code: true,
                  color: 'default',
                },
                plain_text: 'apps/supabase-client/package.json',
                href: null,
              },
            ],
            color: 'default',
          },
        },
      ])

      const result = await blocksToMarkdown(blocks)
      expect(result).toBe(
        '## 問題\n以下のパッケージで `exports` が必要：\n- `apps/supabase-client/package.json`',
      )
    })
  })
})

describe('blocksToMarkdown (async)', async () => {
  it('works without fetchChildren option', async () => {
    const blocks = asBlocks([
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: 'Hello' },
              plain_text: 'Hello',
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              href: null,
            },
          ],
        },
      },
    ])
    const result = await blocksToMarkdown(blocks)
    expect(result).toBe('Hello')
  })

  it('fetches children for nested bulleted_list_item', async () => {
    const childBlocks = asBlocks([
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: 'Nested content' }, plain_text: 'Nested content' },
          ],
        },
      },
    ])
    const mockFetchChildren = vi.fn().mockResolvedValue(childBlocks)

    const blocks = asBlocks([
      {
        id: 'parent-id',
        type: 'bulleted_list_item',
        has_children: true,
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: 'Parent item' }, plain_text: 'Parent item' },
          ],
        },
      },
    ])

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren })

    expect(mockFetchChildren).toHaveBeenCalledWith('parent-id')
    expect(result).toContain('- Parent item')
    expect(result).toContain('Nested content')
  })

  it('handles toggle block with children', async () => {
    const childBlocks = asBlocks([
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: 'Toggle content' }, plain_text: 'Toggle content' },
          ],
        },
      },
    ])
    const mockFetchChildren = vi.fn().mockResolvedValue(childBlocks)

    const blocks = asBlocks([
      {
        id: 'toggle-id',
        type: 'toggle',
        has_children: true,
        toggle: {
          rich_text: [{ type: 'text', text: { content: 'Click me' }, plain_text: 'Click me' }],
        },
      },
    ])

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren })

    expect(mockFetchChildren).toHaveBeenCalledWith('toggle-id')
    expect(result).toContain('<summary>Click me</summary>')
    expect(result).toContain('Toggle content')
  })

  it('handles synced_block with children', async () => {
    const childBlocks = asBlocks([
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: 'Synced content' }, plain_text: 'Synced content' },
          ],
        },
      },
    ])
    const mockFetchChildren = vi.fn().mockResolvedValue(childBlocks)

    const blocks = asBlocks([
      {
        id: 'synced-block-id',
        type: 'synced_block',
        has_children: true,
        synced_block: {
          synced_from: null,
        },
      },
    ])

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren })

    expect(mockFetchChildren).toHaveBeenCalledWith('synced-block-id')
    expect(result).toBe('Synced content')
  })

  it('handles synced_block without children', async () => {
    const blocks = asBlocks([
      {
        id: 'synced-block-id',
        type: 'synced_block',
        has_children: false,
        synced_block: {
          synced_from: { block_id: 'original-block-id' },
        },
      },
    ])

    const result = await blocksToMarkdown(blocks)
    expect(result).toBe('')
  })

  it('handles column_list with columns', async () => {
    const column1Children = asBlocks([
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: 'Column 1 content' }, plain_text: 'Column 1 content' },
          ],
        },
      },
    ])
    const column2Children = asBlocks([
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: 'Column 2 content' }, plain_text: 'Column 2 content' },
          ],
        },
      },
    ])

    const columns = asBlocks([
      {
        id: 'column-1-id',
        type: 'column',
        has_children: true,
        column: {},
      },
      {
        id: 'column-2-id',
        type: 'column',
        has_children: true,
        column: {},
      },
    ])

    const mockFetchChildren = vi.fn().mockImplementation((blockId: string) => {
      if (blockId === 'column-list-id') return Promise.resolve(columns)
      if (blockId === 'column-1-id') return Promise.resolve(column1Children)
      if (blockId === 'column-2-id') return Promise.resolve(column2Children)
      return Promise.resolve([])
    })

    const blocks = asBlocks([
      {
        id: 'column-list-id',
        type: 'column_list',
        has_children: true,
        column_list: {},
      },
    ])

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren })

    expect(mockFetchChildren).toHaveBeenCalledWith('column-list-id')
    expect(mockFetchChildren).toHaveBeenCalledWith('column-1-id')
    expect(mockFetchChildren).toHaveBeenCalledWith('column-2-id')
    expect(result).toContain('Column 1 content')
    expect(result).toContain('Column 2 content')
    expect(result).toContain(':::columns')
  })

  it('handles table with rows', async () => {
    const tableRows = asBlocks([
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Header 1' }, plain_text: 'Header 1' }],
            [{ type: 'text', text: { content: 'Header 2' }, plain_text: 'Header 2' }],
          ],
        },
      },
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Cell 1' }, plain_text: 'Cell 1' }],
            [{ type: 'text', text: { content: 'Cell 2' }, plain_text: 'Cell 2' }],
          ],
        },
      },
    ])

    const mockFetchChildren = vi.fn().mockResolvedValue(tableRows)

    const blocks = asBlocks([
      {
        id: 'table-id',
        type: 'table',
        has_children: true,
        table: {
          table_width: 2,
          has_column_header: true,
          has_row_header: false,
        },
      },
    ])

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren })

    expect(mockFetchChildren).toHaveBeenCalledWith('table-id')
    expect(result).toContain('| Header 1 | Header 2 |')
    expect(result).toContain('| --- | --- |')
    expect(result).toContain('| Cell 1 | Cell 2 |')
  })

  it('handles table without column header', async () => {
    const tableRows = asBlocks([
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Row 1 Cell 1' }, plain_text: 'Row 1 Cell 1' }],
            [{ type: 'text', text: { content: 'Row 1 Cell 2' }, plain_text: 'Row 1 Cell 2' }],
          ],
        },
      },
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Row 2 Cell 1' }, plain_text: 'Row 2 Cell 1' }],
            [{ type: 'text', text: { content: 'Row 2 Cell 2' }, plain_text: 'Row 2 Cell 2' }],
          ],
        },
      },
    ])

    const mockFetchChildren = vi.fn().mockResolvedValue(tableRows)

    const blocks = asBlocks([
      {
        id: 'table-id',
        type: 'table',
        has_children: true,
        table: {
          table_width: 2,
          has_column_header: false,
          has_row_header: false,
        },
      },
    ])

    const result = await blocksToMarkdown(blocks, { fetchChildren: mockFetchChildren })

    expect(result).toContain('| Row 1 Cell 1 | Row 1 Cell 2 |')
    expect(result).toContain('| Row 2 Cell 1 | Row 2 Cell 2 |')
    expect(result).not.toContain('| --- | --- |')
  })

  it('handles template block', async () => {
    const blocks = asBlocks([
      {
        type: 'template',
        template: {
          rich_text: [
            { type: 'text', text: { content: 'Template text' }, plain_text: 'Template text' },
          ],
        },
      },
    ])

    const result = await blocksToMarkdown(blocks)
    expect(result).toBe('<!-- Template block -->')
  })

  it('handles breadcrumb block', async () => {
    const blocks = asBlocks([
      {
        type: 'breadcrumb',
        breadcrumb: {},
      },
    ])

    const result = await blocksToMarkdown(blocks)
    expect(result).toBe('<!-- Breadcrumb -->')
  })

  it('handles link_to_page with page_id', async () => {
    const blocks = asBlocks([
      {
        type: 'link_to_page',
        link_to_page: {
          type: 'page_id',
          page_id: 'page-123',
        },
      },
    ])

    const result = await blocksToMarkdown(blocks)
    expect(result).toBe('[Link to page](page-123)')
  })

  it('handles link_to_page with database_id', async () => {
    const blocks = asBlocks([
      {
        type: 'link_to_page',
        link_to_page: {
          type: 'database_id',
          database_id: 'db-456',
        },
      },
    ])

    const result = await blocksToMarkdown(blocks)
    expect(result).toBe('[Link to database](db-456)')
  })
})
