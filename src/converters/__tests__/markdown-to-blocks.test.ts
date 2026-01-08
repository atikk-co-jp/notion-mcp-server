import { describe, expect, it } from 'vitest'
import type { BlockObjectRequest } from '../../notion-client.js'
import { markdownToBlocks, parseInlineMarkdown } from '../markdown-to-blocks.js'

/**
 * BlockObjectRequestから特定のプロパティにアクセスするヘルパー
 * SDK型は discriminated union なので、直接プロパティアクセスできない
 */
const getBlockProp = <T>(block: BlockObjectRequest, prop: string): T =>
  (block as unknown as Record<string, T>)[prop]

describe('parseInlineMarkdown', () => {
  describe('plain text', () => {
    it('should return plain text as single rich text item', () => {
      const result = parseInlineMarkdown('Hello world')
      expect(result).toEqual([{ type: 'text', text: { content: 'Hello world' } }])
    })

    it('should handle empty string', () => {
      const result = parseInlineMarkdown('')
      expect(result).toEqual([])
    })
  })

  describe('bold', () => {
    it('should parse **bold** text', () => {
      const result = parseInlineMarkdown('This is **bold** text')
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ type: 'text', text: { content: 'This is ' } })
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'bold' },
        annotations: { bold: true },
      })
      expect(result[2]).toEqual({ type: 'text', text: { content: ' text' } })
    })
  })

  describe('italic', () => {
    it('should parse *italic* text', () => {
      const result = parseInlineMarkdown('This is *italic* text')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'italic' },
        annotations: { italic: true },
      })
    })
  })

  describe('strikethrough', () => {
    it('should parse ~~strikethrough~~ text', () => {
      const result = parseInlineMarkdown('This is ~~deleted~~ text')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'deleted' },
        annotations: { strikethrough: true },
      })
    })
  })

  describe('code', () => {
    it('should parse `code` text', () => {
      const result = parseInlineMarkdown('Use `console.log()` here')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'console.log()' },
        annotations: { code: true },
      })
    })
  })

  describe('links', () => {
    it('should parse [text](url) links', () => {
      const result = parseInlineMarkdown('Visit [Google](https://google.com) now')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'Google', link: { url: 'https://google.com' } },
        annotations: {},
      })
    })
  })
})

describe('markdownToBlocks', () => {
  describe('paragraphs', () => {
    it('should convert plain text to paragraph block', () => {
      const result = markdownToBlocks('Hello world')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('paragraph')
      expect(getBlockProp(result[0], 'paragraph')).toEqual({
        rich_text: [{ type: 'text', text: { content: 'Hello world' } }],
      })
    })

    it('should skip empty lines', () => {
      const result = markdownToBlocks('Line 1\n\nLine 2')
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('paragraph')
      expect(result[1].type).toBe('paragraph')
    })
  })

  describe('headings', () => {
    it('should convert # to heading_1', () => {
      const result = markdownToBlocks('# Heading 1')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('heading_1')
      expect(getBlockProp(result[0], 'heading_1')).toEqual({
        rich_text: [{ type: 'text', text: { content: 'Heading 1' } }],
      })
    })

    it('should convert ## to heading_2', () => {
      const result = markdownToBlocks('## Heading 2')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('heading_2')
    })

    it('should convert ### to heading_3', () => {
      const result = markdownToBlocks('### Heading 3')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('heading_3')
    })
  })

  describe('lists', () => {
    it('should convert - to bulleted_list_item', () => {
      const result = markdownToBlocks('- Item 1\n- Item 2')
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('bulleted_list_item')
      expect(result[1].type).toBe('bulleted_list_item')
    })

    it('should convert * to bulleted_list_item', () => {
      const result = markdownToBlocks('* Item 1')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('bulleted_list_item')
    })

    it('should convert 1. to numbered_list_item', () => {
      const result = markdownToBlocks('1. First\n2. Second')
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('numbered_list_item')
      expect(result[1].type).toBe('numbered_list_item')
    })
  })

  describe('checkboxes', () => {
    it('should convert - [ ] to unchecked to_do', () => {
      const result = markdownToBlocks('- [ ] Task')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('to_do')
      expect(getBlockProp(result[0], 'to_do')).toEqual({
        rich_text: [{ type: 'text', text: { content: 'Task' } }],
        checked: false,
      })
    })

    it('should convert - [x] to checked to_do', () => {
      const result = markdownToBlocks('- [x] Done')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('to_do')
      expect((getBlockProp(result[0], 'to_do') as { checked: boolean }).checked).toBe(true)
    })

    it('should handle - [X] (uppercase)', () => {
      const result = markdownToBlocks('- [X] Done')
      expect((getBlockProp(result[0], 'to_do') as { checked: boolean }).checked).toBe(true)
    })
  })

  describe('code blocks', () => {
    it('should convert ``` to code block', () => {
      const result = markdownToBlocks('```\nconst x = 1\n```')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('code')
      expect(getBlockProp(result[0], 'code')).toEqual({
        rich_text: [{ type: 'text', text: { content: 'const x = 1' } }],
        language: 'plain text',
      })
    })

    it('should parse language from code fence', () => {
      const result = markdownToBlocks('```typescript\nconst x: number = 1\n```')
      expect((getBlockProp(result[0], 'code') as { language: string }).language).toBe('typescript')
    })

    it('should handle multi-line code', () => {
      const result = markdownToBlocks('```js\nline1\nline2\nline3\n```')
      const code = getBlockProp(result[0], 'code') as {
        rich_text: Array<{ text: { content: string } }>
      }
      expect(code.rich_text[0].text.content).toBe('line1\nline2\nline3')
    })
  })

  describe('quotes', () => {
    it('should convert > to quote block', () => {
      const result = markdownToBlocks('> This is a quote')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('quote')
      expect(getBlockProp(result[0], 'quote')).toEqual({
        rich_text: [{ type: 'text', text: { content: 'This is a quote' } }],
      })
    })

    it('should combine consecutive quote lines', () => {
      const result = markdownToBlocks('> Line 1\n> Line 2')
      expect(result).toHaveLength(1)
      const quote = getBlockProp(result[0], 'quote') as {
        rich_text: Array<{ text: { content: string } }>
      }
      expect(quote.rich_text[0].text.content).toBe('Line 1\nLine 2')
    })
  })

  describe('dividers', () => {
    it('should convert --- to divider', () => {
      const result = markdownToBlocks('---')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('divider')
      expect(getBlockProp(result[0], 'divider')).toEqual({})
    })

    it('should handle ---- (multiple dashes)', () => {
      const result = markdownToBlocks('----')
      expect(result[0].type).toBe('divider')
    })
  })

  describe('images', () => {
    it('should convert ![alt](url) to image block', () => {
      const result = markdownToBlocks('![Alt text](https://example.com/image.png)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('image')
      expect(getBlockProp(result[0], 'image')).toEqual({
        type: 'external',
        external: { url: 'https://example.com/image.png' },
        caption: [{ type: 'text', text: { content: 'Alt text' } }],
      })
    })

    it('should handle image without alt text', () => {
      const result = markdownToBlocks('![](https://example.com/image.png)')
      expect((getBlockProp(result[0], 'image') as { caption: unknown[] }).caption).toEqual([])
    })
  })

  describe('tables', () => {
    it('should convert simple table to table block', () => {
      const markdown = `| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('table')

      const table = (result[0] as unknown as { table: unknown }).table as {
        table_width: number
        has_column_header: boolean
        has_row_header: boolean
        children: Array<{
          type: string
          table_row: { cells: Array<Array<{ type: string; text: { content: string } }>> }
        }>
      }

      expect(table.table_width).toBe(2)
      expect(table.has_column_header).toBe(true)
      expect(table.has_row_header).toBe(false)
      expect(table.children).toHaveLength(3) // header + 2 data rows
    })

    it('should handle table without header separator', () => {
      const markdown = `| Name | Age |
| Alice | 30 |
| Bob | 25 |`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('table')

      const table = (result[0] as unknown as { table: unknown }).table as {
        has_column_header: boolean
        children: unknown[]
      }
      expect(table.has_column_header).toBe(false)
      expect(table.children).toHaveLength(3)
    })

    it('should parse inline formatting in table cells', () => {
      const markdown = `| Feature | Status |
|---------|--------|
| **Bold** | *italic* |
| \`code\` | [link](https://example.com) |`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('table')

      const table = (result[0] as unknown as { table: unknown }).table as {
        children: Array<{
          table_row: {
            cells: Array<
              Array<{
                text: { content: string }
                annotations?: { bold?: boolean; italic?: boolean; code?: boolean }
              }>
            >
          }
        }>
      }

      // Check first data row (index 1, after header)
      const firstDataRow = table.children[1].table_row.cells
      expect(firstDataRow[0][0].text.content).toBe('Bold')
      expect(firstDataRow[0][0].annotations?.bold).toBe(true)
      expect(firstDataRow[1][0].text.content).toBe('italic')
      expect(firstDataRow[1][0].annotations?.italic).toBe(true)

      // Check second data row
      const secondDataRow = table.children[2].table_row.cells
      expect(secondDataRow[0][0].text.content).toBe('code')
      expect(secondDataRow[0][0].annotations?.code).toBe(true)
    })

    it('should handle table with 3+ columns', () => {
      const markdown = `| エージェント名 | 目的 | プロンプトの特徴 |
|--------------|------|----------------|
| ResearchAgent | トピックのリサーチ | 5つの視点 |
| ContentAgent | コンテンツ生成 | 品質ガイドライン |`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('table')

      const table = (result[0] as unknown as { table: unknown }).table as {
        table_width: number
        children: unknown[]
      }
      expect(table.table_width).toBe(3)
      expect(table.children).toHaveLength(3) // header + 2 data rows
    })

    it('should handle table with alignment indicators', () => {
      const markdown = `| Left | Center | Right |
|:-----|:------:|------:|
| L | C | R |`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('table')

      const table = (result[0] as unknown as { table: unknown }).table as {
        has_column_header: boolean
      }
      expect(table.has_column_header).toBe(true)
    })

    it('should handle empty cells', () => {
      const markdown = `| A | B |
|---|---|
|   | value |
| value |  |`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)

      const table = (result[0] as unknown as { table: unknown }).table as {
        children: Array<{
          table_row: { cells: Array<Array<{ text: { content: string } }>> }
        }>
      }

      // Empty cells should have empty content
      expect(table.children[1].table_row.cells[0]).toEqual([])
      expect(table.children[2].table_row.cells[1]).toEqual([])
    })
  })

  describe('mixed content', () => {
    it('should handle complex markdown document', () => {
      const markdown = `# Title

This is a paragraph with **bold** and *italic*.

## Section

- Item 1
- Item 2

\`\`\`javascript
const x = 1
\`\`\`

> A quote

---

![Image](https://example.com/img.png)`

      const result = markdownToBlocks(markdown)

      expect(result[0].type).toBe('heading_1')
      expect(result[1].type).toBe('paragraph')
      expect(result[2].type).toBe('heading_2')
      expect(result[3].type).toBe('bulleted_list_item')
      expect(result[4].type).toBe('bulleted_list_item')
      expect(result[5].type).toBe('code')
      expect(result[6].type).toBe('quote')
      expect(result[7].type).toBe('divider')
      expect(result[8].type).toBe('image')
    })

    it('should handle document with tables among other content', () => {
      const markdown = `## エージェント一覧

以下のエージェントがあります：

| Name | Purpose |
|------|---------|
| Agent1 | Research |
| Agent2 | Generate |

詳細は下記を参照。`

      const result = markdownToBlocks(markdown)

      expect(result[0].type).toBe('heading_2')
      expect(result[1].type).toBe('paragraph')
      expect(result[2].type).toBe('table')
      expect(result[3].type).toBe('paragraph')
    })
  })
})
