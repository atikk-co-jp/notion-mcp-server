/**
 * Notionページプロパティをシンプルな形式に変換するモジュール
 */

import type { PageObjectResponse, RichTextItemResponse } from '../notion-client.js'
import { richTextToPlain } from './rich-text-to-markdown.js'

/**
 * シンプル化されたプロパティの型
 */
export interface SimpleProperty {
  name: string
  type: string
  value: PropertyValue
}

/**
 * プロパティ値の型
 */
export type PropertyValue = string | number | boolean | string[] | null | Record<string, unknown>

/**
 * ページプロパティの型（SDK型から抽出）
 */
type PageProperty = PageObjectResponse['properties'][string]

/**
 * 単一のプロパティから値を抽出
 */
function extractPropertyValue(prop: PageProperty): PropertyValue {
  const type = prop.type

  switch (type) {
    case 'title': {
      return richTextToPlain(prop.title as RichTextItemResponse[])
    }

    case 'rich_text': {
      return richTextToPlain(prop.rich_text as RichTextItemResponse[])
    }

    case 'number': {
      return prop.number ?? null
    }

    case 'select': {
      return prop.select?.name ?? null
    }

    case 'multi_select': {
      return prop.multi_select?.map((item) => item.name) ?? []
    }

    case 'status': {
      return prop.status?.name ?? null
    }

    case 'date': {
      const date = prop.date
      if (!date) return null
      if (date.end) {
        return `${date.start} → ${date.end}`
      }
      return date.start
    }

    case 'checkbox': {
      return prop.checkbox
    }

    case 'url': {
      return prop.url ?? null
    }

    case 'email': {
      return prop.email ?? null
    }

    case 'phone_number': {
      return prop.phone_number ?? null
    }

    case 'formula': {
      const formula = prop.formula
      if (!formula) return null
      switch (formula.type) {
        case 'string':
          return formula.string ?? null
        case 'number':
          return formula.number ?? null
        case 'boolean':
          return formula.boolean ?? null
        case 'date':
          return formula.date?.start ?? null
        default:
          return null
      }
    }

    case 'relation': {
      return prop.relation?.map((item) => item.id) ?? []
    }

    case 'rollup': {
      const rollup = prop.rollup
      if (!rollup) return null
      switch (rollup.type) {
        case 'number':
          return rollup.number ?? null
        case 'date':
          return rollup.date?.start ?? null
        case 'array':
          return `[${rollup.array?.length ?? 0} items]`
        default:
          return null
      }
    }

    case 'people': {
      return prop.people?.map((person) => {
        if ('name' in person && person.name) {
          return person.name
        }
        return person.id
      }) ?? []
    }

    case 'files': {
      return prop.files?.map((f) => {
        if (f.type === 'external') {
          return f.name ?? f.external.url ?? 'file'
        }
        if (f.type === 'file') {
          return f.name ?? f.file.url ?? 'file'
        }
        // 未知のファイルタイプの場合は name または 'file'
        return (f as { name?: string }).name ?? 'file'
      }) ?? []
    }

    case 'created_time': {
      return prop.created_time ?? null
    }

    case 'created_by': {
      const user = prop.created_by
      if (!user) return null
      if ('name' in user && user.name) {
        return user.name
      }
      return user.id
    }

    case 'last_edited_time': {
      return prop.last_edited_time ?? null
    }

    case 'last_edited_by': {
      const user = prop.last_edited_by
      if (!user) return null
      if ('name' in user && user.name) {
        return user.name
      }
      return user.id
    }

    case 'unique_id': {
      const uniqueId = prop.unique_id
      if (!uniqueId) return null
      return uniqueId.prefix ? `${uniqueId.prefix}-${uniqueId.number}` : String(uniqueId.number)
    }

    case 'verification': {
      return prop.verification?.state ?? null
    }

    case 'button': {
      return '[Button]'
    }

    default: {
      // 未知のプロパティタイプ
      return null
    }
  }
}

/**
 * ページプロパティをシンプルな形式に変換
 * @param properties - Notion APIから取得したプロパティオブジェクト
 * @returns シンプル化されたプロパティの配列
 */
export function pagePropertiesToSimple(
  properties: PageObjectResponse['properties'],
): SimpleProperty[] {
  if (!properties) {
    return []
  }

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    type: prop.type,
    value: extractPropertyValue(prop),
  }))
}

/**
 * ページプロパティをオブジェクト形式に変換（キー: プロパティ名、値: 値）
 * @param properties - Notion APIから取得したプロパティオブジェクト
 * @returns シンプル化されたプロパティオブジェクト
 */
export function pagePropertiesToObject(
  properties: PageObjectResponse['properties'],
): Record<string, PropertyValue> {
  if (!properties) {
    return {}
  }

  const result: Record<string, PropertyValue> = {}
  for (const [name, prop] of Object.entries(properties)) {
    result[name] = extractPropertyValue(prop)
  }
  return result
}

/**
 * シンプル化されたページオブジェクトの型
 */
export interface SimplePage {
  id: string
  url: string
  properties: Record<string, PropertyValue>
}

/**
 * ページオブジェクトをシンプルな形式に変換
 * @param page - Notion APIから取得したページオブジェクト
 * @returns シンプル化されたページオブジェクト
 */
export function pageToSimple(page: PageObjectResponse): SimplePage {
  return {
    id: page.id,
    url: page.url ?? '',
    properties: pagePropertiesToObject(page.properties),
  }
}

/**
 * ページ配列をシンプルな形式に変換
 * @param pages - Notion APIから取得したページ配列
 * @returns シンプル化されたページ配列
 */
export function pagesToSimple(pages: PageObjectResponse[]): SimplePage[] {
  if (!pages) {
    return []
  }
  return pages.map(pageToSimple)
}
