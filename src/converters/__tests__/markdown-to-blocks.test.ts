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

  describe('toggle (details/summary)', () => {
    it('should convert simple <details> to toggle block', () => {
      const markdown = `<details>
<summary>クリックで開く</summary>

ここに中身があります

</details>`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('toggle')
      expect(getBlockProp(result[0], 'toggle')).toMatchObject({
        rich_text: [{ type: 'text', text: { content: 'クリックで開く' } }],
      })
    })

    it('should handle toggle with nested list', () => {
      const markdown = `<details>
<summary>リスト付きトグル</summary>

- Item 1
- Item 2
- Item 3

</details>`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('toggle')

      const toggle = getBlockProp(result[0], 'toggle') as {
        children: Array<{ type: string }>
      }
      expect(toggle.children).toHaveLength(3)
      expect(toggle.children[0].type).toBe('bulleted_list_item')
    })

    it('should handle toggle with code block', () => {
      const markdown = `<details>
<summary>コード例</summary>

\`\`\`typescript
const x = 1
\`\`\`

</details>`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('toggle')

      const toggle = getBlockProp(result[0], 'toggle') as {
        children: Array<{ type: string }>
      }
      expect(toggle.children).toHaveLength(1)
      expect(toggle.children[0].type).toBe('code')
    })

    it('should handle nested toggle', () => {
      const markdown = `<details>
<summary>外側トグル</summary>

<details>
<summary>内側トグル</summary>

ネストされた内容

</details>

</details>`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('toggle')

      const toggle = getBlockProp(result[0], 'toggle') as {
        children: Array<{ type: string }>
      }
      expect(toggle.children).toHaveLength(1)
      expect(toggle.children[0].type).toBe('toggle')
    })

    it('should handle toggle with multiple elements', () => {
      const markdown = `<details>
<summary>複数要素</summary>

## 見出し

段落テキスト

- リストアイテム

</details>`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('toggle')

      const toggle = getBlockProp(result[0], 'toggle') as {
        children: Array<{ type: string }>
      }
      expect(toggle.children).toHaveLength(3)
      expect(toggle.children[0].type).toBe('heading_2')
      expect(toggle.children[1].type).toBe('paragraph')
      expect(toggle.children[2].type).toBe('bulleted_list_item')
    })

    it('should handle toggle with inline formatting in summary', () => {
      const markdown = `<details>
<summary>**太字**と*斜体*のタイトル</summary>

内容

</details>`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('toggle')

      const toggle = getBlockProp(result[0], 'toggle') as {
        rich_text: Array<{ text: { content: string }; annotations?: { bold?: boolean; italic?: boolean } }>
      }
      // Check inline formatting is parsed
      expect(toggle.rich_text.some((rt) => rt.annotations?.bold)).toBe(true)
      expect(toggle.rich_text.some((rt) => rt.annotations?.italic)).toBe(true)
    })
  })

  describe('callout (GitHub Alerts)', () => {
    it('should convert > [!NOTE] to callout block', () => {
      const markdown = `> [!NOTE]
> これはノートです`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        rich_text: Array<{ text: { content: string } }>
        icon: { type: string; emoji: string }
      }
      expect(callout.rich_text[0].text.content).toBe('これはノートです')
      expect(callout.icon.emoji).toBe('ℹ️')
    })

    it('should convert > [!WARNING] to callout with warning icon', () => {
      const markdown = `> [!WARNING]
> 警告メッセージ`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        icon: { emoji: string }
      }
      expect(callout.icon.emoji).toBe('⚠️')
    })

    it('should convert > [!TIP] to callout with tip icon', () => {
      const markdown = `> [!TIP]
> ヒントメッセージ`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        icon: { emoji: string }
      }
      expect(callout.icon.emoji).toBe('💡')
    })

    it('should convert > [!IMPORTANT] to callout with important icon', () => {
      const markdown = `> [!IMPORTANT]
> 重要なメッセージ`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        icon: { emoji: string }
      }
      expect(callout.icon.emoji).toBe('❗')
    })

    it('should convert > [!CAUTION] to callout with caution icon', () => {
      const markdown = `> [!CAUTION]
> 注意メッセージ`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        icon: { emoji: string }
      }
      expect(callout.icon.emoji).toBe('🔴')
    })

    it('should handle multi-line callout', () => {
      const markdown = `> [!NOTE]
> 1行目
> 2行目
> 3行目`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        rich_text: Array<{ text: { content: string } }>
      }
      expect(callout.rich_text[0].text.content).toBe('1行目\n2行目\n3行目')
    })

    it('should handle callout with inline formatting', () => {
      const markdown = `> [!NOTE]
> これは**太字**と*斜体*です`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('callout')

      const callout = getBlockProp(result[0], 'callout') as {
        rich_text: Array<{ annotations?: { bold?: boolean; italic?: boolean } }>
      }
      expect(callout.rich_text.some((rt) => rt.annotations?.bold)).toBe(true)
      expect(callout.rich_text.some((rt) => rt.annotations?.italic)).toBe(true)
    })
  })

  describe('equation ($$)', () => {
    it('should convert $$ block to equation', () => {
      const markdown = `$$
E = mc^2
$$`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('equation')
      expect(getBlockProp(result[0], 'equation')).toEqual({
        expression: 'E = mc^2',
      })
    })

    it('should handle multi-line equation', () => {
      const markdown = `$$
\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('equation')
      expect(getBlockProp(result[0], 'equation')).toEqual({
        expression: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
      })
    })

    it('should handle complex LaTeX equation', () => {
      const markdown = `$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n
$$`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('equation')

      const equation = getBlockProp(result[0], 'equation') as { expression: string }
      expect(equation.expression).toContain('\\sum')
    })

    it('should handle inline single-line $$ equation', () => {
      const markdown = `$$E = mc^2$$`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('equation')
      expect(getBlockProp(result[0], 'equation')).toEqual({
        expression: 'E = mc^2',
      })
    })
  })

  describe('underline', () => {
    it('should parse <u>underline</u> in inline text', () => {
      const result = parseInlineMarkdown('This is <u>underlined</u> text')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'underlined' },
        annotations: { underline: true },
      })
    })

    it('should parse ++underline++ in inline text', () => {
      const result = parseInlineMarkdown('This is ++underlined++ text')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'underlined' },
        annotations: { underline: true },
      })
    })

    it('should handle underline in paragraph block', () => {
      const result = markdownToBlocks('Text with <u>underline</u> here')
      expect(result).toHaveLength(1)

      const para = getBlockProp(result[0], 'paragraph') as {
        rich_text: Array<{ annotations?: { underline?: boolean } }>
      }
      expect(para.rich_text.some((rt) => rt.annotations?.underline)).toBe(true)
    })
  })

  describe('color', () => {
    it('should parse {color:red}text{/color} as colored text', () => {
      const result = parseInlineMarkdown('This is {color:red}red text{/color} here')
      expect(result).toHaveLength(3)
      expect(result[1]).toEqual({
        type: 'text',
        text: { content: 'red text' },
        annotations: { color: 'red' },
      })
    })

    it('should parse {color:blue}text{/color}', () => {
      const result = parseInlineMarkdown('{color:blue}blue{/color}')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'text',
        text: { content: 'blue' },
        annotations: { color: 'blue' },
      })
    })

    it('should handle background color {bg:yellow}text{/bg}', () => {
      const result = parseInlineMarkdown('{bg:yellow}highlighted{/bg}')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        type: 'text',
        text: { content: 'highlighted' },
        annotations: { color: 'yellow_background' },
      })
    })

    it('should handle all Notion color values', () => {
      const colors = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']
      for (const color of colors) {
        const result = parseInlineMarkdown(`{color:${color}}test{/color}`)
        expect(result[0]).toMatchObject({
          annotations: { color },
        })
      }
    })
  })

  describe('bookmark', () => {
    it('should convert [bookmark](url) to bookmark block', () => {
      const result = markdownToBlocks('[bookmark](https://example.com)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('bookmark')
      expect(getBlockProp(result[0], 'bookmark')).toEqual({
        url: 'https://example.com',
        caption: [],
      })
    })

    it('should handle bookmark with caption', () => {
      const result = markdownToBlocks('[bookmark:Example Site](https://example.com)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('bookmark')
      expect(getBlockProp(result[0], 'bookmark')).toEqual({
        url: 'https://example.com',
        caption: [{ type: 'text', text: { content: 'Example Site' } }],
      })
    })

    it('should convert > 🔗 url format to bookmark', () => {
      const result = markdownToBlocks('> 🔗 https://example.com')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('bookmark')
      expect(getBlockProp(result[0], 'bookmark')).toMatchObject({
        url: 'https://example.com',
      })
    })
  })

  describe('column_list (columns)', () => {
    it('should convert :::columns to column_list block', () => {
      const markdown = `:::columns
:::column
左カラム
:::
:::column
右カラム
:::
:::`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('column_list')

      const columnList = getBlockProp(result[0], 'column_list') as {
        children: Array<{ type: string }>
      }
      expect(columnList.children).toHaveLength(2)
      expect(columnList.children[0].type).toBe('column')
      expect(columnList.children[1].type).toBe('column')
    })

    it('should handle 3 columns', () => {
      const markdown = `:::columns
:::column
カラム1
:::
:::column
カラム2
:::
:::column
カラム3
:::
:::`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('column_list')

      const columnList = getBlockProp(result[0], 'column_list') as {
        children: Array<{ type: string }>
      }
      expect(columnList.children).toHaveLength(3)
    })

    it('should handle columns with multiple elements', () => {
      const markdown = `:::columns
:::column
## 見出し

段落

- リスト
:::
:::column
コード付き

\`\`\`js
const x = 1
\`\`\`
:::
:::`

      const result = markdownToBlocks(markdown)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('column_list')

      const columnList = getBlockProp(result[0], 'column_list') as {
        children: Array<{
          type: string
          column: { children: Array<{ type: string }> }
        }>
      }
      // First column should have heading, paragraph, list item
      expect(columnList.children[0].column.children).toHaveLength(3)
      // Second column should have paragraph and code
      expect(columnList.children[1].column.children).toHaveLength(2)
    })
  })

  describe('embed', () => {
    it('should convert @[embed](url) to embed block', () => {
      const result = markdownToBlocks('@[embed](https://www.youtube.com/watch?v=123)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('embed')
      expect(getBlockProp(result[0], 'embed')).toEqual({
        url: 'https://www.youtube.com/watch?v=123',
        caption: [],
      })
    })

    it('should handle embed with caption', () => {
      const result = markdownToBlocks('@[embed:動画タイトル](https://www.youtube.com/watch?v=123)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('embed')
      expect(getBlockProp(result[0], 'embed')).toEqual({
        url: 'https://www.youtube.com/watch?v=123',
        caption: [{ type: 'text', text: { content: '動画タイトル' } }],
      })
    })
  })

  describe('video', () => {
    it('should convert @[video](url) to video block', () => {
      const result = markdownToBlocks('@[video](https://example.com/video.mp4)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('video')
      expect(getBlockProp(result[0], 'video')).toEqual({
        type: 'external',
        external: { url: 'https://example.com/video.mp4' },
        caption: [],
      })
    })
  })

  describe('audio', () => {
    it('should convert @[audio](url) to audio block', () => {
      const result = markdownToBlocks('@[audio](https://example.com/audio.mp3)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('audio')
      expect(getBlockProp(result[0], 'audio')).toEqual({
        type: 'external',
        external: { url: 'https://example.com/audio.mp3' },
        caption: [],
      })
    })
  })

  describe('file', () => {
    it('should convert @[file](url) to file block', () => {
      const result = markdownToBlocks('@[file](https://example.com/document.pdf)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('file')
      expect(getBlockProp(result[0], 'file')).toEqual({
        type: 'external',
        external: { url: 'https://example.com/document.pdf' },
        caption: [],
        name: 'document.pdf',
      })
    })

    it('should handle file with custom name', () => {
      const result = markdownToBlocks('@[file:カスタム名](https://example.com/doc.pdf)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('file')
      expect(getBlockProp(result[0], 'file')).toMatchObject({
        name: 'カスタム名',
      })
    })
  })

  describe('pdf', () => {
    it('should convert @[pdf](url) to pdf block', () => {
      const result = markdownToBlocks('@[pdf](https://example.com/document.pdf)')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('pdf')
      expect(getBlockProp(result[0], 'pdf')).toEqual({
        type: 'external',
        external: { url: 'https://example.com/document.pdf' },
        caption: [],
      })
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

  describe('table_of_contents', () => {
    it('converts [TOC] to table_of_contents', () => {
      const blocks = markdownToBlocks('[TOC]')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('table_of_contents')
      expect(getBlockProp(blocks[0], 'table_of_contents')).toEqual({ color: 'default' })
    })

    it('converts [toc] (lowercase) to table_of_contents', () => {
      const blocks = markdownToBlocks('[toc]')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('table_of_contents')
    })

    it('converts [Toc] (mixed case) to table_of_contents', () => {
      const blocks = markdownToBlocks('[Toc]')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('table_of_contents')
    })

    it('handles [TOC] with surrounding whitespace', () => {
      const blocks = markdownToBlocks('  [TOC]  ')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('table_of_contents')
    })

    it('does not convert [TOC] inside text', () => {
      const blocks = markdownToBlocks('See [TOC] for details')
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe('paragraph')
    })
  })
})
