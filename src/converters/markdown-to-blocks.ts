/**
 * Markdown文字列をNotionブロック配列に変換するモジュール
 */

import type { BlockObjectRequest } from '../notion-client.js'

// 安全性のための制限値
const MAX_INPUT_LENGTH = 100_000 // 100KB
const MAX_LINE_LENGTH = 10_000 // 10KB per line
const MAX_CODE_BLOCK_LINES = 1000

/**
 * RichTextリクエストの型（SDK内部型に準拠）
 */
interface RichTextRequest {
  type: 'text'
  text: {
    content: string
    link?: { url: string } | null
  }
  annotations?: {
    bold?: boolean
    italic?: boolean
    strikethrough?: boolean
    underline?: boolean
    code?: boolean
    color?: string
  }
}

/**
 * インラインMarkdown記法をRichText配列に変換
 * サポート: **bold**, *italic*, ~~strike~~, `code`, [text](url)
 */
export function parseInlineMarkdown(text: string): RichTextRequest[] {
  // 行長制限（ReDoS対策）
  const safeText = text.length > MAX_LINE_LENGTH ? text.slice(0, MAX_LINE_LENGTH) : text

  const result: RichTextRequest[] = []

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
    // 下線: <u>text</u>
    { regex: /<u>([^<]+)<\/u>/g, type: 'underline' as const },
    // 下線: ++text++
    { regex: /\+\+([^+]+)\+\+/g, type: 'underline' as const },
    // 文字色: {color:xxx}text{/color}
    { regex: /\{color:([^}]+)\}([^{]+)\{\/color\}/g, type: 'color' as const },
    // 背景色: {bg:xxx}text{/bg}
    { regex: /\{bg:([^}]+)\}([^{]+)\{\/bg\}/g, type: 'bg_color' as const },
  ]

  // 単純な実装: マークダウン記法を順番に処理
  // 複雑なネストは非対応（Notion APIも完全なネストは非対応）
  let lastIndex = 0

  // 全パターンをまとめて検索
  const allMatches: Array<{
    index: number
    length: number
    content: string
    type: 'link' | 'bold' | 'italic' | 'strikethrough' | 'code' | 'underline' | 'color' | 'bg_color'
    url?: string
    color?: string
  }> = []

  for (const { regex, type } of patterns) {
    const re = new RegExp(regex.source, 'g')
    let match: RegExpExecArray | null = re.exec(safeText)
    while (match !== null) {
      // color/bg_color: match[1]=color, match[2]=content
      // link: match[1]=content, match[2]=url
      // others: match[1]=content
      if (type === 'color' || type === 'bg_color') {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          content: match[2],
          type,
          color: match[1],
        })
      } else {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          content: match[1],
          type,
          url: type === 'link' ? match[2] : undefined,
        })
      }
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
    const richText: RichTextRequest = {
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
      case 'underline':
        richText.annotations = { underline: true }
        break
      case 'color':
        richText.annotations = { color: match.color }
        break
      case 'bg_color':
        richText.annotations = { color: `${match.color}_background` }
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
): BlockObjectRequest {
  return {
    type,
    [type]: {
      rich_text: parseInlineMarkdown(text),
      ...extra,
    },
  } as BlockObjectRequest
}

/**
 * Markdown文字列をNotionブロック配列に変換
 */
export function markdownToBlocks(markdown: string): BlockObjectRequest[] {
  // 入力長制限（ReDoS対策）
  const safeMarkdown =
    markdown.length > MAX_INPUT_LENGTH ? markdown.slice(0, MAX_INPUT_LENGTH) : markdown

  const blocks: BlockObjectRequest[] = []
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
      } as BlockObjectRequest)
      i++ // closing ```
      continue
    }

    // 数式ブロック: $$ ... $$
    if (line.trim() === '$$' || line.trim().startsWith('$$')) {
      // インライン形式: $$E = mc^2$$
      const inlineMatch = line.trim().match(/^\$\$(.+)\$\$$/)
      if (inlineMatch) {
        blocks.push({
          type: 'equation',
          equation: { expression: inlineMatch[1].trim() },
        } as BlockObjectRequest)
        i++
        continue
      }

      // 複数行形式: $$ ... $$
      const equationLines: string[] = []
      i++ // opening $$
      while (i < lines.length && lines[i].trim() !== '$$') {
        equationLines.push(lines[i])
        i++
      }
      blocks.push({
        type: 'equation',
        equation: { expression: equationLines.join('\n').trim() },
      } as BlockObjectRequest)
      i++ // closing $$
      continue
    }

    // 水平線: ---
    if (/^-{3,}$/.test(line.trim())) {
      blocks.push({ type: 'divider', divider: {} } as BlockObjectRequest)
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

    // コールアウト (GitHub Alerts): > [!NOTE], > [!WARNING], etc.
    const calloutMatch = line.match(/^>\s*\[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]/)
    if (calloutMatch) {
      const alertType = calloutMatch[1]
      // アイコンのマッピング
      const iconMap: Record<string, string> = {
        NOTE: 'ℹ️',
        WARNING: '⚠️',
        TIP: '💡',
        IMPORTANT: '❗',
        CAUTION: '🔴',
      }
      const icon = iconMap[alertType] || 'ℹ️'

      // 内容を収集（次の行から）
      const calloutLines: string[] = []
      i++
      while (i < lines.length && lines[i].startsWith('>')) {
        calloutLines.push(lines[i].replace(/^>\s*/, ''))
        i++
      }
      blocks.push({
        type: 'callout',
        callout: {
          rich_text: parseInlineMarkdown(calloutLines.join('\n')),
          icon: { type: 'emoji', emoji: icon },
        },
      } as BlockObjectRequest)
      continue
    }

    // ブックマーク: > 🔗 url
    const bookmarkLinkMatch = line.match(/^>\s*🔗\s*(https?:\/\/\S+)$/)
    if (bookmarkLinkMatch) {
      blocks.push({
        type: 'bookmark',
        bookmark: {
          url: bookmarkLinkMatch[1],
          caption: [],
        },
      } as BlockObjectRequest)
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
      } as BlockObjectRequest)
      i++
      continue
    }

    // ブックマーク: [bookmark](url) or [bookmark:caption](url)
    const bookmarkMatch = line.match(/^\[bookmark(?::([^\]]*))?\]\(([^)]+)\)$/)
    if (bookmarkMatch) {
      blocks.push({
        type: 'bookmark',
        bookmark: {
          url: bookmarkMatch[2],
          caption: bookmarkMatch[1]
            ? [{ type: 'text', text: { content: bookmarkMatch[1] } }]
            : [],
        },
      } as BlockObjectRequest)
      i++
      continue
    }

    // メディア: @[embed](url), @[video](url), @[audio](url), @[file](url), @[pdf](url)
    const mediaMatch = line.match(/^@\[(embed|video|audio|file|pdf)(?::([^\]]*))?\]\(([^)]+)\)$/)
    if (mediaMatch) {
      const mediaType = mediaMatch[1]
      const caption = mediaMatch[2]
      const url = mediaMatch[3]

      if (mediaType === 'embed') {
        blocks.push({
          type: 'embed',
          embed: {
            url,
            caption: caption ? [{ type: 'text', text: { content: caption } }] : [],
          },
        } as BlockObjectRequest)
      } else if (mediaType === 'video') {
        blocks.push({
          type: 'video',
          video: {
            type: 'external',
            external: { url },
            caption: caption ? [{ type: 'text', text: { content: caption } }] : [],
          },
        } as BlockObjectRequest)
      } else if (mediaType === 'audio') {
        blocks.push({
          type: 'audio',
          audio: {
            type: 'external',
            external: { url },
            caption: caption ? [{ type: 'text', text: { content: caption } }] : [],
          },
        } as BlockObjectRequest)
      } else if (mediaType === 'pdf') {
        blocks.push({
          type: 'pdf',
          pdf: {
            type: 'external',
            external: { url },
            caption: caption ? [{ type: 'text', text: { content: caption } }] : [],
          },
        } as BlockObjectRequest)
      } else if (mediaType === 'file') {
        // ファイル名をURLから抽出
        const fileName = caption || url.split('/').pop() || 'file'
        blocks.push({
          type: 'file',
          file: {
            type: 'external',
            external: { url },
            caption: [],
            name: fileName,
          },
        } as BlockObjectRequest)
      }
      i++
      continue
    }

    // トグル: <details><summary>title</summary>content</details>
    if (line.trim() === '<details>' || line.trim().startsWith('<details>')) {
      // summaryを取得
      let summary = ''
      let contentStartIndex = i + 1

      // 同じ行に<summary>がある場合
      const sameLine = line.match(/<details>\s*<summary>([^<]*)<\/summary>/)
      if (sameLine) {
        summary = sameLine[1]
      } else {
        // 次の行で<summary>を探す
        i++
        if (i < lines.length) {
          const summaryMatch = lines[i].match(/<summary>([^<]*)<\/summary>/)
          if (summaryMatch) {
            summary = summaryMatch[1]
            contentStartIndex = i + 1
          }
        }
      }

      // 内容を収集（</details>まで）
      const toggleContent: string[] = []
      i = contentStartIndex
      let depth = 1
      while (i < lines.length && depth > 0) {
        const currentLine = lines[i]
        if (currentLine.includes('<details>')) depth++
        if (currentLine.includes('</details>')) {
          depth--
          if (depth === 0) break
        }
        if (depth > 0 && currentLine.trim() && !currentLine.includes('</details>')) {
          toggleContent.push(currentLine)
        }
        i++
      }
      i++ // closing </details>

      // 子ブロックを再帰的に変換
      const childBlocks = markdownToBlocks(toggleContent.join('\n'))

      blocks.push({
        type: 'toggle',
        toggle: {
          rich_text: parseInlineMarkdown(summary),
          children: childBlocks,
        },
      } as BlockObjectRequest)
      continue
    }

    // カラムリスト: :::columns ... :::
    if (line.trim() === ':::columns') {
      const columns: BlockObjectRequest[][] = []
      let currentColumn: string[] = []
      let inColumn = false
      i++

      while (i < lines.length) {
        const currentLine = lines[i].trim()

        if (currentLine === ':::column') {
          // 新しいカラムの開始（前のカラムがあれば保存）
          if (inColumn && currentColumn.length > 0) {
            columns.push(markdownToBlocks(currentColumn.join('\n')))
            currentColumn = []
          }
          inColumn = true
          i++
          continue
        }

        if (currentLine === ':::') {
          if (inColumn) {
            // カラムの終了
            if (currentColumn.length > 0) {
              columns.push(markdownToBlocks(currentColumn.join('\n')))
              currentColumn = []
            }
            inColumn = false
          } else {
            // columns全体の終了
            i++
            break
          }
          i++
          continue
        }

        // カラム内のコンテンツを収集
        if (inColumn) {
          currentColumn.push(lines[i])
        }
        i++
      }

      // column_listブロックを生成
      if (columns.length > 0) {
        blocks.push({
          type: 'column_list',
          column_list: {
            children: columns.map((columnBlocks) => ({
              type: 'column',
              column: {
                children: columnBlocks,
              },
            })),
          },
        } as BlockObjectRequest)
      }
      continue
    }

    // テーブル: | col1 | col2 | ... |
    // テーブル行は | で始まり | で終わる
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableRows: string[][] = []
      let hasHeaderSeparator = false
      let headerSeparatorIndex = -1

      // テーブル行を収集
      while (i < lines.length) {
        const currentLine = lines[i].trim()
        if (!currentLine.startsWith('|') || !currentLine.endsWith('|')) {
          break
        }

        // セパレーター行の検出: | --- | --- | or |:---|:---| etc.
        if (
          /^\|[\s:]*-{3,}[\s:]*\|/.test(currentLine) &&
          /\|[\s:]*-{3,}[\s:]*\|$/.test(currentLine)
        ) {
          // すべてのセルがセパレーターパターンかチェック
          const separatorCells = currentLine.slice(1, -1).split('|')
          const isSeparator = separatorCells.every((cell) => /^[\s:]*-{3,}[\s:]*$/.test(cell))
          if (isSeparator) {
            hasHeaderSeparator = true
            headerSeparatorIndex = tableRows.length
            i++
            continue
          }
        }

        // セルを抽出 (先頭と末尾の | を除去してから分割)
        const cells = currentLine
          .slice(1, -1)
          .split('|')
          .map((cell) => cell.trim())
        tableRows.push(cells)
        i++
      }

      // テーブルブロックを生成
      if (tableRows.length > 0) {
        // 列数を最初の行から決定
        const tableWidth = tableRows[0].length

        // テーブルブロックを作成
        const tableBlock = {
          type: 'table',
          table: {
            table_width: tableWidth,
            has_column_header: hasHeaderSeparator && headerSeparatorIndex === 1,
            has_row_header: false,
            children: tableRows.map((row) => ({
              type: 'table_row',
              table_row: {
                cells: row.map((cell) => parseInlineMarkdown(cell)),
              },
            })),
          },
        } as BlockObjectRequest
        blocks.push(tableBlock)
      }
      continue
    }

    // デフォルト: 段落
    blocks.push(createTextBlock('paragraph', line))
    i++
  }

  return blocks
}
