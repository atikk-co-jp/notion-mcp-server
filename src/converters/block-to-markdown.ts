/**
 * Notionブロックをマークダウン文字列に変換するモジュール
 */

import type { BlockObjectResponse } from '../notion-client.js'
import { richTextToMarkdown } from './rich-text-to-markdown.js'

/**
 * ブロック変換オプション
 */
export interface ConvertOptions {
  /** インデントレベル（ネストされたブロック用） */
  indentLevel?: number
  /** 番号付きリストのインデックス */
  listIndex?: number
  /** 子ブロック取得関数（ネストされたブロックの再帰的取得用） */
  fetchChildren?: (blockId: string) => Promise<BlockObjectResponse[]>
}

/**
 * ファイルオブジェクトからURLを抽出
 */
function extractFileUrl(
  fileObj:
    | { type: 'external'; external: { url: string } }
    | { type: 'file'; file: { url: string } }
    | { type: 'file_upload'; file_upload: { id: string } }
    | undefined,
): string {
  if (!fileObj) return ''
  if (fileObj.type === 'external') {
    return fileObj.external.url
  }
  if (fileObj.type === 'file') {
    return fileObj.file.url
  }
  return ''
}

/**
 * アイコンからテキストを抽出
 * SDK の PageIconResponse 型は custom_emoji も含むため any 経由で処理
 */
function extractIconText(icon: unknown): string {
  if (!icon || typeof icon !== 'object') return ''
  const iconObj = icon as { type?: string; emoji?: string }
  if (iconObj.type === 'emoji' && iconObj.emoji) {
    return iconObj.emoji
  }
  return ''
}

/**
 * 単一のブロックをマークダウンに変換
 */
async function convertBlock(
  block: BlockObjectResponse,
  options: ConvertOptions = {},
): Promise<string> {
  const indent = '  '.repeat(options.indentLevel ?? 0)

  switch (block.type) {
    case 'paragraph': {
      const text = richTextToMarkdown(block.paragraph.rich_text)
      return text ? `${indent}${text}` : ''
    }

    case 'heading_1': {
      const text = richTextToMarkdown(block.heading_1.rich_text)
      return `${indent}# ${text}`
    }

    case 'heading_2': {
      const text = richTextToMarkdown(block.heading_2.rich_text)
      return `${indent}## ${text}`
    }

    case 'heading_3': {
      const text = richTextToMarkdown(block.heading_3.rich_text)
      return `${indent}### ${text}`
    }

    case 'bulleted_list_item': {
      const text = richTextToMarkdown(block.bulleted_list_item.rich_text)
      let result = `${indent}- ${text}`

      // 子ブロックがある場合
      if (block.has_children && options.fetchChildren) {
        const children = await options.fetchChildren(block.id)
        const childMarkdown = await blocksToMarkdown(children, {
          ...options,
          indentLevel: (options.indentLevel ?? 0) + 1,
        })
        if (childMarkdown) {
          result += `\n${childMarkdown}`
        }
      }

      return result
    }

    case 'numbered_list_item': {
      const text = richTextToMarkdown(block.numbered_list_item.rich_text)
      const index = options.listIndex ?? 1
      let result = `${indent}${index}. ${text}`

      // 子ブロックがある場合
      if (block.has_children && options.fetchChildren) {
        const children = await options.fetchChildren(block.id)
        const childMarkdown = await blocksToMarkdown(children, {
          ...options,
          indentLevel: (options.indentLevel ?? 0) + 1,
        })
        if (childMarkdown) {
          result += `\n${childMarkdown}`
        }
      }

      return result
    }

    case 'to_do': {
      const text = richTextToMarkdown(block.to_do.rich_text)
      const checked = block.to_do.checked ? 'x' : ' '
      return `${indent}- [${checked}] ${text}`
    }

    case 'toggle': {
      const text = richTextToMarkdown(block.toggle.rich_text)
      let result = `${indent}<details>\n${indent}<summary>${text}</summary>\n`

      // 子ブロックがある場合
      if (block.has_children && options.fetchChildren) {
        const children = await options.fetchChildren(block.id)
        const childMarkdown = await blocksToMarkdown(children, {
          ...options,
          indentLevel: (options.indentLevel ?? 0) + 1,
        })
        if (childMarkdown) {
          result += `\n${childMarkdown}\n`
        }
      }

      result += `${indent}</details>`
      return result
    }

    case 'code': {
      const text = richTextToMarkdown(block.code.rich_text)
      const language = block.code.language || ''
      const caption = block.code.caption ? richTextToMarkdown(block.code.caption) : ''
      let result = `${indent}\`\`\`${language}\n${text}\n${indent}\`\`\``
      if (caption) {
        result += `\n${indent}*${caption}*`
      }
      return result
    }

    case 'quote': {
      const text = richTextToMarkdown(block.quote.rich_text)
      // 複数行の場合は各行に > を付ける
      const lines = text.split('\n')
      return lines.map((line) => `${indent}> ${line}`).join('\n')
    }

    case 'callout': {
      const text = richTextToMarkdown(block.callout.rich_text)
      const icon = extractIconText(block.callout.icon)
      // アイコンからGitHub Alerts形式を推測
      const alertTypeMap: Record<string, string> = {
        'ℹ️': 'NOTE',
        '⚠️': 'WARNING',
        '💡': 'TIP',
        '❗': 'IMPORTANT',
        '🔴': 'CAUTION',
      }
      const alertType = alertTypeMap[icon] || 'NOTE'
      const lines = text.split('\n')
      return `${indent}> [!${alertType}]\n${lines.map((line) => `${indent}> ${line}`).join('\n')}`
    }

    case 'divider': {
      return `${indent}---`
    }

    case 'bookmark': {
      const url = block.bookmark.url || ''
      const caption = block.bookmark.caption ? richTextToMarkdown(block.bookmark.caption) : ''
      if (caption) {
        return `${indent}[bookmark:${caption}](${url})`
      }
      return `${indent}[bookmark](${url})`
    }

    case 'image': {
      const url = extractFileUrl(block.image)
      const caption = block.image.caption ? richTextToMarkdown(block.image.caption) : ''
      return `${indent}![${caption}](${url})`
    }

    case 'video': {
      const url = extractFileUrl(block.video)
      const caption = block.video.caption ? richTextToMarkdown(block.video.caption) : ''
      if (caption) {
        return `${indent}@[video:${caption}](${url})`
      }
      return `${indent}@[video](${url})`
    }

    case 'audio': {
      const url = extractFileUrl(block.audio)
      const caption = block.audio.caption ? richTextToMarkdown(block.audio.caption) : ''
      if (caption) {
        return `${indent}@[audio:${caption}](${url})`
      }
      return `${indent}@[audio](${url})`
    }

    case 'file': {
      const url = extractFileUrl(block.file)
      const name = block.file.name || ''
      if (name) {
        return `${indent}@[file:${name}](${url})`
      }
      return `${indent}@[file](${url})`
    }

    case 'pdf': {
      const url = extractFileUrl(block.pdf)
      const caption = block.pdf.caption ? richTextToMarkdown(block.pdf.caption) : ''
      if (caption) {
        return `${indent}@[pdf:${caption}](${url})`
      }
      return `${indent}@[pdf](${url})`
    }

    case 'embed': {
      const url = block.embed.url || ''
      const caption = block.embed.caption ? richTextToMarkdown(block.embed.caption) : ''
      if (caption) {
        return `${indent}@[embed:${caption}](${url})`
      }
      return `${indent}@[embed](${url})`
    }

    case 'table_of_contents': {
      return `${indent}[TOC]`
    }

    case 'equation': {
      const expression = block.equation.expression || ''
      return `${indent}$$\n${expression}\n$$`
    }

    case 'child_page': {
      const title = block.child_page.title || 'Untitled'
      return `${indent}📄 [${title}]`
    }

    case 'child_database': {
      const title = block.child_database.title || 'Untitled Database'
      return `${indent}📊 [${title}]`
    }

    case 'link_preview': {
      const url = block.link_preview.url || ''
      return `${indent}[${url}](${url})`
    }

    case 'synced_block': {
      // 同期ブロックの内容は子ブロックとして取得される
      if (block.has_children && options.fetchChildren) {
        const children = await options.fetchChildren(block.id)
        return await blocksToMarkdown(children, options)
      }
      return ''
    }

    case 'column_list': {
      // カラムリストは子ブロック（column）として処理
      if (block.has_children && options.fetchChildren) {
        const children = await options.fetchChildren(block.id)
        const columnContents: string[] = []
        for (const column of children) {
          if (column.type === 'column' && column.has_children && options.fetchChildren) {
            const columnChildren = await options.fetchChildren(column.id)
            const content = await blocksToMarkdown(columnChildren, options)
            if (content) {
              columnContents.push(`${indent}:::column\n${content}\n${indent}:::`)
            }
          }
        }
        // :::columns 形式で出力
        return `${indent}:::columns\n${columnContents.join('\n')}\n${indent}:::`
      }
      return ''
    }

    case 'column': {
      // column自体は直接変換しない（column_listで処理）
      return ''
    }

    case 'table': {
      // テーブルは子ブロック（table_row）として処理
      if (block.has_children && options.fetchChildren) {
        const children = await options.fetchChildren(block.id)
        const rows: string[] = []
        const hasColumnHeader = block.table.has_column_header

        for (let i = 0; i < children.length; i++) {
          const row = children[i]
          if (row.type === 'table_row') {
            const cells = row.table_row.cells || []
            const cellTexts = cells.map((cell) => richTextToMarkdown(cell))
            rows.push(`${indent}| ${cellTexts.join(' | ')} |`)

            // ヘッダー行の後にセパレーターを追加
            if (i === 0 && hasColumnHeader) {
              const separator = cells.map(() => '---').join(' | ')
              rows.push(`${indent}| ${separator} |`)
            }
          }
        }
        return rows.join('\n')
      }
      return ''
    }

    case 'table_row': {
      // table_rowは直接変換しない（tableで処理）
      return ''
    }

    case 'breadcrumb': {
      return `${indent}<!-- Breadcrumb -->`
    }

    case 'template': {
      // テンプレートブロックは非推奨
      return `${indent}<!-- Template block -->`
    }

    case 'link_to_page': {
      const linkTo = block.link_to_page
      if (linkTo.type === 'page_id') {
        return `${indent}[Link to page](${linkTo.page_id})`
      }
      if (linkTo.type === 'database_id') {
        return `${indent}[Link to database](${linkTo.database_id})`
      }
      return `${indent}<!-- Link to page -->`
    }

    default: {
      // 未対応ブロックタイプ
      return `${indent}<!-- Unsupported block type: ${block.type} -->`
    }
  }
}

/**
 * ブロック配列をマークダウン文字列に変換
 * @param blocks - Notion APIから取得したブロック配列
 * @param options - 変換オプション
 * @returns マークダウン文字列
 */
export async function blocksToMarkdown(
  blocks: BlockObjectResponse[],
  options: ConvertOptions = {},
): Promise<string> {
  if (!blocks || blocks.length === 0) {
    return ''
  }

  const lines: string[] = []
  let numberedListIndex = 1

  for (const block of blocks) {
    // 番号付きリストのインデックス管理
    const isNumberedList = block.type === 'numbered_list_item'
    const currentOptions = {
      ...options,
      listIndex: isNumberedList ? numberedListIndex : undefined,
    }

    const markdown = await convertBlock(block, currentOptions)

    // 番号付きリストのインデックスをインクリメント
    if (isNumberedList) {
      numberedListIndex++
    } else {
      numberedListIndex = 1 // リセット
    }

    // 空でない結果のみ追加
    if (markdown) {
      lines.push(markdown)
    }
  }

  return lines.join('\n')
}
