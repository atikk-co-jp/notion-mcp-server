/**
 * Notionページプロパティをシンプルな形式に変換するモジュール
 */

import { type RichTextItem, richTextToPlain } from './rich-text-to-markdown.js'

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
 * Notionプロパティオブジェクトの型
 */
export interface NotionProperty {
  id?: string
  type: string
  [key: string]: unknown
}

/**
 * 単一のプロパティから値を抽出
 */
function extractPropertyValue(prop: NotionProperty): PropertyValue {
  const type = prop.type
  const data = prop[type]

  switch (type) {
    case 'title': {
      return richTextToPlain(data as RichTextItem[])
    }

    case 'rich_text': {
      return richTextToPlain(data as RichTextItem[])
    }

    case 'number': {
      return (data as number) ?? null
    }

    case 'select': {
      const select = data as { name: string } | null
      return select?.name ?? null
    }

    case 'multi_select': {
      const multiSelect = data as { name: string }[]
      return multiSelect?.map((item) => item.name) ?? []
    }

    case 'status': {
      const status = data as { name: string } | null
      return status?.name ?? null
    }

    case 'date': {
      const date = data as { start: string; end?: string | null } | null
      if (!date) return null
      if (date.end) {
        return `${date.start} → ${date.end}`
      }
      return date.start
    }

    case 'checkbox': {
      return data as boolean
    }

    case 'url': {
      return (data as string) ?? null
    }

    case 'email': {
      return (data as string) ?? null
    }

    case 'phone_number': {
      return (data as string) ?? null
    }

    case 'formula': {
      const formula = data as {
        type: string
        string?: string
        number?: number
        boolean?: boolean
        date?: { start: string }
      }
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
      const relations = data as { id: string }[]
      return relations?.map((item) => item.id) ?? []
    }

    case 'rollup': {
      const rollup = data as {
        type: string
        number?: number
        date?: { start: string }
        array?: unknown[]
      }
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
      const people = data as { name?: string; id: string }[]
      return people?.map((person) => person.name ?? person.id) ?? []
    }

    case 'files': {
      const files = data as { name?: string; external?: { url: string }; file?: { url: string } }[]
      return (
        files?.map((f) => {
          const url = f.external?.url ?? f.file?.url
          return f.name ?? url ?? 'file'
        }) ?? []
      )
    }

    case 'created_time': {
      return (data as string) ?? null
    }

    case 'created_by': {
      const user = data as { name?: string; id: string } | null
      return user?.name ?? user?.id ?? null
    }

    case 'last_edited_time': {
      return (data as string) ?? null
    }

    case 'last_edited_by': {
      const user = data as { name?: string; id: string } | null
      return user?.name ?? user?.id ?? null
    }

    case 'unique_id': {
      const uniqueId = data as { prefix?: string; number: number } | null
      if (!uniqueId) return null
      return uniqueId.prefix ? `${uniqueId.prefix}-${uniqueId.number}` : String(uniqueId.number)
    }

    case 'verification': {
      const verification = data as { state: string } | null
      return verification?.state ?? null
    }

    case 'button': {
      return '[Button]'
    }

    default: {
      // 未知のプロパティタイプ
      if (data !== undefined && data !== null) {
        return JSON.stringify(data)
      }
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
  properties: Record<string, NotionProperty>,
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
  properties: Record<string, NotionProperty>,
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
export function pageToSimple(page: {
  id: string
  url?: string
  properties: Record<string, NotionProperty>
}): SimplePage {
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
export function pagesToSimple(
  pages: { id: string; url?: string; properties: Record<string, NotionProperty> }[],
): SimplePage[] {
  if (!pages) {
    return []
  }
  return pages.map(pageToSimple)
}
