import { describe, expect, it } from 'vitest'
import { type RichTextItem, richTextToMarkdown, richTextToPlain } from '../rich-text-to-markdown.js'

describe('richTextToMarkdown', () => {
  describe('basic text conversion', () => {
    it('converts plain text', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'Hello World' },
          plain_text: 'Hello World',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('Hello World')
    })

    it('handles empty array', () => {
      expect(richTextToMarkdown([])).toBe('')
    })

    it('handles undefined input', () => {
      expect(richTextToMarkdown(undefined as unknown as RichTextItem[])).toBe('')
    })

    it('handles null input', () => {
      expect(richTextToMarkdown(null as unknown as RichTextItem[])).toBe('')
    })

    it('concatenates multiple text items', () => {
      const input: RichTextItem[] = [
        { type: 'text', text: { content: 'Hello ' }, plain_text: 'Hello ' },
        { type: 'text', text: { content: 'World' }, plain_text: 'World' },
      ]
      expect(richTextToMarkdown(input)).toBe('Hello World')
    })
  })

  describe('annotations', () => {
    it('converts bold text', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'bold' },
          annotations: { bold: true },
          plain_text: 'bold',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('**bold**')
    })

    it('converts italic text', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'italic' },
          annotations: { italic: true },
          plain_text: 'italic',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('*italic*')
    })

    it('converts strikethrough text', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'strikethrough' },
          annotations: { strikethrough: true },
          plain_text: 'strikethrough',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('~~strikethrough~~')
    })

    it('converts code text', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'code' },
          annotations: { code: true },
          plain_text: 'code',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('`code`')
    })

    it('converts underline text with HTML tag', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'underline' },
          annotations: { underline: true },
          plain_text: 'underline',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('<u>underline</u>')
    })

    it('handles nested annotations (bold + italic)', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'bold italic' },
          annotations: { bold: true, italic: true },
          plain_text: 'bold italic',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('***bold italic***')
    })

    it('handles all annotations combined', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'all' },
          annotations: {
            bold: true,
            italic: true,
            strikethrough: true,
            code: true,
          },
          plain_text: 'all',
        },
      ]
      // code -> strikethrough -> italic -> bold の順で適用
      // bold + italic が *** として結合される
      expect(richTextToMarkdown(input)).toBe('***~~`all`~~***')
    })
  })

  describe('links', () => {
    it('converts text with link (text.link)', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: {
            content: 'link text',
            link: { url: 'https://example.com' },
          },
          plain_text: 'link text',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('[link text](https://example.com)')
    })

    it('converts text with link (href)', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: { content: 'link text' },
          href: 'https://example.com',
          plain_text: 'link text',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('[link text](https://example.com)')
    })

    it('handles code annotation with link (ignores link)', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: {
            content: 'code',
            link: { url: 'https://example.com' },
          },
          annotations: { code: true },
          plain_text: 'code',
        },
      ]
      // コード内のリンクは無視される
      expect(richTextToMarkdown(input)).toBe('`code`')
    })

    it('handles bold link', () => {
      const input: RichTextItem[] = [
        {
          type: 'text',
          text: {
            content: 'bold link',
            link: { url: 'https://example.com' },
          },
          annotations: { bold: true },
          plain_text: 'bold link',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('[**bold link**](https://example.com)')
    })
  })

  describe('mention types', () => {
    it('converts user mention', () => {
      const input: RichTextItem[] = [
        {
          type: 'mention',
          mention: {
            type: 'user',
            user: { id: 'user-123', name: 'John Doe' },
          },
          plain_text: '@John Doe',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('@John Doe')
    })

    it('converts page mention', () => {
      const input: RichTextItem[] = [
        {
          type: 'mention',
          mention: {
            type: 'page',
            page: { id: 'page-123' },
          },
          plain_text: 'My Page',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('My Page')
    })

    it('converts date mention', () => {
      const input: RichTextItem[] = [
        {
          type: 'mention',
          mention: {
            type: 'date',
            date: { start: '2024-01-01' },
          },
          plain_text: '@January 1, 2024',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('2024-01-01')
    })

    it('converts date range mention', () => {
      const input: RichTextItem[] = [
        {
          type: 'mention',
          mention: {
            type: 'date',
            date: { start: '2024-01-01', end: '2024-01-31' },
          },
          plain_text: '@January 1, 2024 → January 31, 2024',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('2024-01-01 → 2024-01-31')
    })
  })

  describe('equation types', () => {
    it('converts equation', () => {
      const input: RichTextItem[] = [
        {
          type: 'equation',
          equation: { expression: 'E = mc^2' },
          plain_text: 'E = mc^2',
        },
      ]
      expect(richTextToMarkdown(input)).toBe('$E = mc^2$')
    })
  })

  describe('mixed content', () => {
    it('handles mixed plain and formatted text', () => {
      const input: RichTextItem[] = [
        { type: 'text', text: { content: 'This is ' }, plain_text: 'This is ' },
        {
          type: 'text',
          text: { content: 'bold' },
          annotations: { bold: true },
          plain_text: 'bold',
        },
        { type: 'text', text: { content: ' and ' }, plain_text: ' and ' },
        {
          type: 'text',
          text: { content: 'italic' },
          annotations: { italic: true },
          plain_text: 'italic',
        },
        { type: 'text', text: { content: ' text.' }, plain_text: ' text.' },
      ]
      expect(richTextToMarkdown(input)).toBe('This is **bold** and *italic* text.')
    })

    it('handles real-world Notion data', () => {
      // 実際のNotionから取得したデータ形式
      const input: RichTextItem[] = [
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
          text: { content: ' と ', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default',
          },
          plain_text: ' と ',
          href: null,
        },
        {
          type: 'text',
          text: { content: 'main', link: null },
          annotations: {
            bold: false,
            italic: false,
            strikethrough: false,
            underline: false,
            code: true,
            color: 'default',
          },
          plain_text: 'main',
          href: null,
        },
      ]
      expect(richTextToMarkdown(input)).toBe('以下のパッケージで `exports` と `main`')
    })
  })
})

describe('richTextToPlain', () => {
  it('extracts plain text', () => {
    const input: RichTextItem[] = [
      {
        type: 'text',
        text: { content: 'Hello' },
        annotations: { bold: true },
        plain_text: 'Hello',
      },
      { type: 'text', text: { content: ' World' }, plain_text: ' World' },
    ]
    expect(richTextToPlain(input)).toBe('Hello World')
  })

  it('handles empty array', () => {
    expect(richTextToPlain([])).toBe('')
  })

  it('handles undefined input', () => {
    expect(richTextToPlain(undefined as unknown as RichTextItem[])).toBe('')
  })

  it('prefers plain_text over text.content', () => {
    const input: RichTextItem[] = [
      {
        type: 'text',
        text: { content: 'content' },
        plain_text: 'plain',
      },
    ]
    expect(richTextToPlain(input)).toBe('plain')
  })
})
