/**
 * Markdown文字列をNotionブロック配列に変換するモジュール
 */

import type { RichTextItem } from './rich-text-to-markdown.js'

// 安全性のための制限値
const MAX_INPUT_LENGTH = 100_000 // 100KB
const MAX_LINE_LENGTH = 10_000 // 10KB per line
const MAX_CODE_BLOCK_LINES = 1000

/**
 * Notionブロックの型定義（簡易版）
 */
export interface NotionBlock {
  type: string
  [key: string]: unknown
}

/**
 * インラインMarkdown記法をRichText配列に変換
 * サポート: **bold**, *italic*, ~~strike~~, `code`, [text](url)
 */
export function parseInlineMarkdown(text: string): RichTextItem[] {
  // 行長制限（ReDoS対策）
  const safeText = text.length > MAX_LINE_LENGTH ? text.slice(0, MAX_LINE_LENGTH) : text

  const result: RichTextItem[] = []

  // 正規表現パターン（優先順位順）
  const patterns = [
    // リンク: [text](url)
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' as const },
    // 太字: **text**
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' as const },
    // イタリック: *text* (太字でないもの)
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)/g, type: 'italic' as const },
    // 取り消し線: ~~text~~
    { regex: /~~([^~]+)~~/g, type: 'strikethrough' as const },
    // インラインコード: `code`
    { regex: /`([^`]+)`/g, type: 'code' as const },
  ]

  // 単純な実装: マークダウン記法を順番に処理
  // 複雑なネストは非対応（Notion APIも完全なネストは非対応）
  let lastIndex = 0

  // 全パターンをまとめて検索
  const allMatches: Array<{
    index: number
    length: number
    content: string
    type: 'link' | 'bold' | 'italic' | 'strikethrough' | 'code'
    url?: string
  }> = []

  for (const { regex, type } of patterns) {
    const re = new RegExp(regex.source, 'g')
    let match: RegExpExecArray | null = re.exec(safeText)
    while (match !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        content: match[1],
        type,
        url: type === 'link' ? match[2] : undefined,
      })
      match = re.exec(safeText)
    }
  }

  // インデックス順にソート
  allMatches.sort((a, b) => a.index - b.index)

  // 重複を除去（先に来たものを優先）
  const filteredMatches: typeof allMatches = []
  let lastEnd = 0
  for (const m of allMatches) {
    if (m.index >= lastEnd) {
      filteredMatches.push(m)
      lastEnd = m.index + m.length
    }
  }

  // RichText配列を構築
  lastIndex = 0
  for (const match of filteredMatches) {
    // マッチ前のプレーンテキスト
    if (match.index > lastIndex) {
      const plainText = safeText.slice(lastIndex, match.index)
      if (plainText) {
        result.push({
          type: 'text',
          text: { content: plainText },
        })
      }
    }

    // マッチしたテキスト
    const richText: RichTextItem = {
      type: 'text',
      text: { content: match.content },
      annotations: {},
    }

    switch (match.type) {
      case 'bold':
        richText.annotations = { bold: true }
        break
      case 'italic':
        richText.annotations = { italic: true }
        break
      case 'strikethrough':
        richText.annotations = { strikethrough: true }
        break
      case 'code':
        richText.annotations = { code: true }
        break
      case 'link':
        if (match.url) {
          richText.text = { content: match.content, link: { url: match.url } }
        }
        break
    }

    result.push(richText)
    lastIndex = match.index + match.length
  }

  // 残りのプレーンテキスト
  if (lastIndex < safeText.length) {
    const plainText = safeText.slice(lastIndex)
    if (plainText) {
      result.push({
        type: 'text',
        text: { content: plainText },
      })
    }
  }

  // 何もマッチしなかった場合
  if (result.length === 0 && safeText) {
    result.push({
      type: 'text',
      text: { content: safeText },
    })
  }

  return result
}

/**
 * RichTextを含むブロックを生成するヘルパー
 */
function createTextBlock(
  type: string,
  text: string,
  extra: Record<string, unknown> = {},
): NotionBlock {
  return {
    type,
    [type]: {
      rich_text: parseInlineMarkdown(text),
      ...extra,
    },
  }
}

/**
 * Markdown文字列をNotionブロック配列に変換
 */
export function markdownToBlocks(markdown: string): NotionBlock[] {
  // 入力長制限（ReDoS対策）
  const safeMarkdown =
    markdown.length > MAX_INPUT_LENGTH ? markdown.slice(0, MAX_INPUT_LENGTH) : markdown

  const blocks: NotionBlock[] = []
  const lines = safeMarkdown.split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // 空行はスキップ
    if (!line.trim()) {
      i++
      continue
    }

    // コードブロック: ```language
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'plain text'
      const codeLines: string[] = []
      i++
      while (
        i < lines.length &&
        !lines[i].startsWith('```') &&
        codeLines.length < MAX_CODE_BLOCK_LINES
      ) {
        codeLines.push(lines[i])
        i++
      }
      // 残りの行をスキップ（制限超過時）
      while (i < lines.length && !lines[i].startsWith('```')) {
        i++
      }
      blocks.push({
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content: codeLines.join('\n') } }],
          language,
        },
      })
      i++ // closing ```
      continue
    }

    // 水平線: ---
    if (/^-{3,}$/.test(line.trim())) {
      blocks.push({ type: 'divider', divider: {} })
      i++
      continue
    }

    // 見出し: # ## ### (####以上はheading_3にフォールバック)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const rawLevel = headingMatch[1].length
      const level = Math.min(rawLevel, 3) as 1 | 2 | 3
      const text = headingMatch[2]
      const type = `heading_${level}` as 'heading_1' | 'heading_2' | 'heading_3'
      blocks.push(createTextBlock(type, text))
      i++
      continue
    }

    // チェックボックス: - [ ] or - [x]
    const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)$/)
    if (todoMatch) {
      const checked = todoMatch[1].toLowerCase() === 'x'
      const text = todoMatch[2]
      blocks.push(createTextBlock('to_do', text, { checked }))
      i++
      continue
    }

    // 箇条書き: - or *
    const bulletMatch = line.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      blocks.push(createTextBlock('bulleted_list_item', bulletMatch[1]))
      i++
      continue
    }

    // 番号付きリスト: 1. 2. etc
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/)
    if (numberedMatch) {
      blocks.push(createTextBlock('numbered_list_item', numberedMatch[1]))
      i++
      continue
    }

    // 引用: >
    const quoteMatch = line.match(/^>\s*(.*)$/)
    if (quoteMatch) {
      // 連続する引用行をまとめる
      const quoteLines: string[] = [quoteMatch[1]]
      i++
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s*/, ''))
        i++
      }
      blocks.push(createTextBlock('quote', quoteLines.join('\n')))
      continue
    }

    // 画像: ![alt](url)
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      blocks.push({
        type: 'image',
        image: {
          type: 'external',
          external: { url: imageMatch[2] },
          caption: imageMatch[1] ? [{ type: 'text', text: { content: imageMatch[1] } }] : [],
        },
      })
      i++
      continue
    }

    // デフォルト: 段落
    blocks.push(createTextBlock('paragraph', line))
    i++
  }

  return blocks
}
