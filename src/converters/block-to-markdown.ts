/**
 * Notionブロックをマークダウン文字列に変換するモジュール
 */

import { type RichTextItem, richTextToMarkdown } from './rich-text-to-markdown.js'

/**
 * Notionブロックの基本型
 */
export interface NotionBlock {
  object?: string
  id?: string
  type: string
  has_children?: boolean
  [key: string]: unknown
}

/**
 * ブロック変換オプション
 */
export interface ConvertOptions {
  /** インデントレベル（ネストされたブロック用） */
  indentLevel?: number
  /** 番号付きリストのインデックス */
  listIndex?: number
  /** 子ブロック取得関数（ネストされたブロックの再帰的取得用） */
  fetchChildren?: (blockId: string) => Promise<NotionBlock[]>
}

/**
 * ファイルオブジェクトからURLを抽出
 */
function extractFileUrl(
  fileObj: { type?: string; external?: { url: string }; file?: { url: string } } | undefined,
): string {
  if (!fileObj) return ''
  if (fileObj.type === 'external' && fileObj.external?.url) {
    return fileObj.external.url
  }
  if (fileObj.type === 'file' && fileObj.file?.url) {
    return fileObj.file.url
  }
  // type が指定されていない場合のフォールバック
  if (fileObj.external?.url) return fileObj.external.url
  if (fileObj.file?.url) return fileObj.file.url
  return ''
}

/**
 * アイコンからテキストを抽出
 */
function extractIconText(
  icon: { type?: string; emoji?: string; external?: { url: string } } | undefined,
): string {
  if (!icon) return ''
  if (icon.type === 'emoji' && icon.emoji) {
    return icon.emoji
  }
  return ''
}

/**
 * 単一のブロックをマークダウンに変換
 */
async function convertBlock(block: NotionBlock, options: ConvertOptions = {}): Promise<string> {
  const indent = '  '.repeat(options.indentLevel ?? 0)
  const blockData = block[block.type] as Record<string, unknown> | undefined

  if (!blockData && block.type !== 'divider') {
    // 未対応ブロックタイプの場合
    return `${indent}<!-- Unsupported block type: ${block.type} -->`
  }

  switch (block.type) {
    case 'paragraph': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      return text ? `${indent}${text}` : ''
    }

    case 'heading_1': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      return `${indent}# ${text}`
    }

    case 'heading_2': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      return `${indent}## ${text}`
    }

    case 'heading_3': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      return `${indent}### ${text}`
    }

    case 'bulleted_list_item': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      let result = `${indent}- ${text}`

      // 子ブロックがある場合
      if (block.has_children && options.fetchChildren && block.id) {
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
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      const index = options.listIndex ?? 1
      let result = `${indent}${index}. ${text}`

      // 子ブロックがある場合
      if (block.has_children && options.fetchChildren && block.id) {
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
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      const checked = blockData?.checked ? 'x' : ' '
      return `${indent}- [${checked}] ${text}`
    }

    case 'toggle': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      let result = `${indent}<details>\n${indent}<summary>${text}</summary>\n`

      // 子ブロックがある場合
      if (block.has_children && options.fetchChildren && block.id) {
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
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      const language = (blockData?.language as string) || ''
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      let result = `${indent}\`\`\`${language}\n${text}\n${indent}\`\`\``
      if (caption) {
        result += `\n${indent}*${caption}*`
      }
      return result
    }

    case 'quote': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      // 複数行の場合は各行に > を付ける
      const lines = text.split('\n')
      return lines.map((line) => `${indent}> ${line}`).join('\n')
    }

    case 'callout': {
      const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
      const icon = extractIconText(blockData?.icon as { type?: string; emoji?: string } | undefined)
      const prefix = icon ? `${icon} ` : ''
      return `${indent}> ${prefix}**Note:** ${text}`
    }

    case 'divider': {
      return `${indent}---`
    }

    case 'bookmark': {
      const url = (blockData?.url as string) || ''
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      const displayText = caption || url
      return `${indent}[${displayText}](${url})`
    }

    case 'image': {
      const url = extractFileUrl(
        blockData as { type?: string; external?: { url: string }; file?: { url: string } },
      )
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      return `${indent}![${caption}](${url})`
    }

    case 'video': {
      const url = extractFileUrl(
        blockData as { type?: string; external?: { url: string }; file?: { url: string } },
      )
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      const displayText = caption || 'Video'
      return `${indent}[${displayText}](${url})`
    }

    case 'audio': {
      const url = extractFileUrl(
        blockData as { type?: string; external?: { url: string }; file?: { url: string } },
      )
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      const displayText = caption || 'Audio'
      return `${indent}[${displayText}](${url})`
    }

    case 'file':
    case 'pdf': {
      const url = extractFileUrl(
        blockData as { type?: string; external?: { url: string }; file?: { url: string } },
      )
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      const name = (blockData?.name as string) || caption || 'File'
      return `${indent}[${name}](${url})`
    }

    case 'embed': {
      const url = (blockData?.url as string) || ''
      const caption = blockData?.caption
        ? richTextToMarkdown(blockData.caption as RichTextItem[])
        : ''
      const displayText = caption || 'Embed'
      return `${indent}[${displayText}](${url})`
    }

    case 'table_of_contents': {
      return `${indent}[TOC]`
    }

    case 'equation': {
      const expression = (blockData?.expression as string) || ''
      return `${indent}$$\n${expression}\n$$`
    }

    case 'child_page': {
      const title = (blockData?.title as string) || 'Untitled'
      return `${indent}📄 [${title}]`
    }

    case 'child_database': {
      const title = (blockData?.title as string) || 'Untitled Database'
      return `${indent}📊 [${title}]`
    }

    case 'link_preview': {
      const url = (blockData?.url as string) || ''
      return `${indent}[${url}](${url})`
    }

    case 'synced_block': {
      // 同期ブロックの内容は子ブロックとして取得される
      if (block.has_children && options.fetchChildren && block.id) {
        const children = await options.fetchChildren(block.id)
        return await blocksToMarkdown(children, options)
      }
      return ''
    }

    case 'column_list': {
      // カラムリストは子ブロック（column）として処理
      if (block.has_children && options.fetchChildren && block.id) {
        const children = await options.fetchChildren(block.id)
        const columnContents: string[] = []
        for (const column of children) {
          if (column.type === 'column' && column.has_children && options.fetchChildren) {
            const columnChildren = await options.fetchChildren(column.id as string)
            const content = await blocksToMarkdown(columnChildren, options)
            if (content) {
              columnContents.push(content)
            }
          }
        }
        // カラムを | で区切って表示
        return columnContents.join('\n\n---\n\n')
      }
      return ''
    }

    case 'column': {
      // column自体は直接変換しない（column_listで処理）
      return ''
    }

    case 'table': {
      // テーブルは子ブロック（table_row）として処理
      if (block.has_children && options.fetchChildren && block.id) {
        const children = await options.fetchChildren(block.id)
        const rows: string[] = []
        const hasColumnHeader = blockData?.has_column_header as boolean

        for (let i = 0; i < children.length; i++) {
          const row = children[i]
          if (row.type === 'table_row') {
            const rowData = row.table_row as { cells?: RichTextItem[][] }
            const cells = rowData?.cells || []
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
  blocks: NotionBlock[],
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

/**
 * ブロック配列をマークダウン文字列に変換（同期版、子ブロック取得なし）
 * @param blocks - Notion APIから取得したブロック配列
 * @returns マークダウン文字列
 */
export function blocksToMarkdownSync(blocks: NotionBlock[]): string {
  if (!blocks || blocks.length === 0) {
    return ''
  }

  const lines: string[] = []
  let numberedListIndex = 1

  for (const block of blocks) {
    const indent = ''
    const blockData = block[block.type] as Record<string, unknown> | undefined
    let markdown = ''

    switch (block.type) {
      case 'paragraph': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = text ? `${indent}${text}` : ''
        break
      }

      case 'heading_1': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = `${indent}# ${text}`
        break
      }

      case 'heading_2': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = `${indent}## ${text}`
        break
      }

      case 'heading_3': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = `${indent}### ${text}`
        break
      }

      case 'bulleted_list_item': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = `${indent}- ${text}`
        break
      }

      case 'numbered_list_item': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = `${indent}${numberedListIndex}. ${text}`
        numberedListIndex++
        break
      }

      case 'to_do': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        const checked = blockData?.checked ? 'x' : ' '
        markdown = `${indent}- [${checked}] ${text}`
        break
      }

      case 'toggle': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        markdown = `${indent}<details>\n${indent}<summary>${text}</summary>\n${indent}</details>`
        break
      }

      case 'code': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        const language = (blockData?.language as string) || ''
        markdown = `${indent}\`\`\`${language}\n${text}\n${indent}\`\`\``
        break
      }

      case 'quote': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        const lines = text.split('\n')
        markdown = lines.map((line) => `${indent}> ${line}`).join('\n')
        break
      }

      case 'callout': {
        const text = richTextToMarkdown(blockData?.rich_text as RichTextItem[])
        const icon = extractIconText(
          blockData?.icon as { type?: string; emoji?: string } | undefined,
        )
        const prefix = icon ? `${icon} ` : ''
        markdown = `${indent}> ${prefix}**Note:** ${text}`
        break
      }

      case 'divider': {
        markdown = `${indent}---`
        break
      }

      case 'bookmark': {
        const url = (blockData?.url as string) || ''
        const caption = blockData?.caption
          ? richTextToMarkdown(blockData.caption as RichTextItem[])
          : ''
        const displayText = caption || url
        markdown = `${indent}[${displayText}](${url})`
        break
      }

      case 'image': {
        const url = extractFileUrl(
          blockData as { type?: string; external?: { url: string }; file?: { url: string } },
        )
        const caption = blockData?.caption
          ? richTextToMarkdown(blockData.caption as RichTextItem[])
          : ''
        markdown = `${indent}![${caption}](${url})`
        break
      }

      case 'video':
      case 'audio': {
        const url = extractFileUrl(
          blockData as { type?: string; external?: { url: string }; file?: { url: string } },
        )
        const caption = blockData?.caption
          ? richTextToMarkdown(blockData.caption as RichTextItem[])
          : ''
        const displayText = caption || (block.type === 'video' ? 'Video' : 'Audio')
        markdown = `${indent}[${displayText}](${url})`
        break
      }

      case 'file':
      case 'pdf': {
        const url = extractFileUrl(
          blockData as { type?: string; external?: { url: string }; file?: { url: string } },
        )
        const caption = blockData?.caption
          ? richTextToMarkdown(blockData.caption as RichTextItem[])
          : ''
        const name = (blockData?.name as string) || caption || 'File'
        markdown = `${indent}[${name}](${url})`
        break
      }

      case 'embed': {
        const url = (blockData?.url as string) || ''
        const caption = blockData?.caption
          ? richTextToMarkdown(blockData.caption as RichTextItem[])
          : ''
        const displayText = caption || 'Embed'
        markdown = `${indent}[${displayText}](${url})`
        break
      }

      case 'table_of_contents': {
        markdown = `${indent}[TOC]`
        break
      }

      case 'equation': {
        const expression = (blockData?.expression as string) || ''
        markdown = `${indent}$$\n${expression}\n$$`
        break
      }

      case 'child_page': {
        const title = (blockData?.title as string) || 'Untitled'
        markdown = `${indent}📄 [${title}]`
        break
      }

      case 'child_database': {
        const title = (blockData?.title as string) || 'Untitled Database'
        markdown = `${indent}📊 [${title}]`
        break
      }

      case 'link_preview': {
        const url = (blockData?.url as string) || ''
        markdown = `${indent}[${url}](${url})`
        break
      }

      default: {
        if (blockData) {
          markdown = `${indent}<!-- Unsupported block type: ${block.type} -->`
        }
        break
      }
    }

    // 番号付きリスト以外の場合はインデックスをリセット
    if (block.type !== 'numbered_list_item') {
      numberedListIndex = 1
    }

    if (markdown) {
      lines.push(markdown)
    }
  }

  return lines.join('\n')
}
