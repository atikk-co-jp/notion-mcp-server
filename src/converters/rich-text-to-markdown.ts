/**
 * RichText配列をマークダウン文字列に変換するモジュール
 */

import type { RichTextItemResponse } from '../notion-client.js'

/**
 * 単一のRichTextアイテムをマークダウンに変換
 */
function convertRichTextItem(item: RichTextItemResponse): string {
  // テキスト内容を取得
  let text = item.plain_text

  // Mention type の処理
  if (item.type === 'mention' && item.mention) {
    const mention = item.mention
    switch (mention.type) {
      case 'user':
        text = `@${mention.user && 'name' in mention.user ? mention.user.name : 'user'}`
        break
      case 'page':
        text = item.plain_text || `[page](${mention.page.id})`
        break
      case 'database':
        text = item.plain_text || `[database](${mention.database.id})`
        break
      case 'date':
        text = mention.date?.start ?? ''
        if (mention.date?.end) {
          text += ` → ${mention.date.end}`
        }
        break
      case 'link_preview':
        text = mention.link_preview?.url ?? ''
        break
      default:
        text = item.plain_text || ''
    }
  }

  // Equation type の処理
  if (item.type === 'equation' && item.equation) {
    return `$${item.equation.expression}$`
  }

  // 空文字列の場合はそのまま返す
  if (!text) {
    return ''
  }

  // annotations がない場合はデフォルト値を使用（テスト用データ対応）
  const annotations = item.annotations ?? {}

  // アノテーション適用（内側から外側へ）
  // code が最も内側
  if (annotations.code) {
    text = `\`${text}\``
  }

  // strikethrough
  if (annotations.strikethrough) {
    text = `~~${text}~~`
  }

  // italic
  if (annotations.italic) {
    text = `*${text}*`
  }

  // bold
  if (annotations.bold) {
    text = `**${text}**`
  }

  // underline はマークダウンで標準サポートされていないため、HTMLタグを使用
  if (annotations.underline) {
    text = `<u>${text}</u>`
  }

  // リンク処理（text.link または href）
  const href = (item.type === 'text' && item.text.link?.url) ?? item.href
  if (href && !annotations.code) {
    // コード内のリンクは無視
    text = `[${text}](${href})`
  }

  return text
}

/**
 * RichText配列をマークダウン文字列に変換
 * @param richTexts - Notion APIから取得したRichText配列
 * @returns マークダウン文字列
 */
export function richTextToMarkdown(richTexts: RichTextItemResponse[]): string {
  if (!richTexts || richTexts.length === 0) {
    return ''
  }
  return richTexts.map(convertRichTextItem).join('')
}

/**
 * RichText配列からプレーンテキストを抽出
 * @param richTexts - Notion APIから取得したRichText配列
 * @returns プレーンテキスト文字列
 */
export function richTextToPlain(richTexts: RichTextItemResponse[]): string {
  if (!richTexts || richTexts.length === 0) {
    return ''
  }
  return richTexts.map((item) => item.plain_text).join('')
}
