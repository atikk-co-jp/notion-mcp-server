import type { z } from 'zod'
import type { Block } from './schemas/block.js'
import type { CoverSchema, IconSchema, RichTextSchema } from './schemas/common.js'
import type { DatabasePropertiesSchema } from './schemas/database.js'
import type { FilterSchema, SortSchema } from './schemas/filter.js'
import type { PropertyValueSchema } from './schemas/page.js'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

// Infer types from schemas
type RichText = z.infer<typeof RichTextSchema>
type Icon = z.infer<typeof IconSchema>
type Cover = z.infer<typeof CoverSchema>
type PropertyValue = z.infer<typeof PropertyValueSchema>
type DatabaseProperties = z.infer<typeof DatabasePropertiesSchema>
type Filter = z.infer<typeof FilterSchema>
type Sort = z.infer<typeof SortSchema>

export interface NotionClientOptions {
  token: string
}

export interface NotionRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
}

export interface NotionError {
  object: 'error'
  status: number
  code: string
  message: string
}

export class NotionClient {
  private token: string

  constructor(options: NotionClientOptions) {
    this.token = options.token
  }

  private async request<T>(endpoint: string, options: NotionRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query } = options

    let url = `${NOTION_API_BASE}${endpoint}`
    if (query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.set(key, String(value))
        }
      }
      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as NotionError
      throw new Error(`Notion API error: ${error.code} - ${error.message}`)
    }

    return data as T
  }

  // Pages
  pages = {
    create: <T>(params: {
      parent: { database_id: string } | { page_id: string }
      properties: Record<string, PropertyValue>
      children?: Block[]
      icon?: Icon
      cover?: Cover
    }): Promise<T> => {
      return this.request<T>('/pages', { method: 'POST', body: params })
    },

    retrieve: <T>(params: { page_id: string }): Promise<T> => {
      return this.request<T>(`/pages/${params.page_id}`)
    },

    update: <T>(params: {
      page_id: string
      properties?: Record<string, PropertyValue>
      archived?: boolean
      icon?: Icon | null
      cover?: Cover | null
    }): Promise<T> => {
      const { page_id, ...body } = params
      return this.request<T>(`/pages/${page_id}`, { method: 'PATCH', body })
    },
  }

  // Databases
  databases = {
    create: <T>(params: {
      parent: { page_id: string }
      title?: RichText[]
      properties: DatabaseProperties
      icon?: Icon
      cover?: Cover
      is_inline?: boolean
    }): Promise<T> => {
      return this.request<T>('/databases', { method: 'POST', body: params })
    },

    query: <T>(params: {
      database_id: string
      filter?: Filter
      sorts?: Sort[]
      start_cursor?: string
      page_size?: number
    }): Promise<T> => {
      const { database_id, ...body } = params
      return this.request<T>(`/databases/${database_id}/query`, { method: 'POST', body })
    },

    retrieve: <T>(params: { database_id: string }): Promise<T> => {
      return this.request<T>(`/databases/${params.database_id}`)
    },

    update: <T>(params: {
      database_id: string
      title?: RichText[]
      description?: RichText[]
      properties?: DatabaseProperties
      icon?: Icon | null
      cover?: Cover | null
      is_inline?: boolean
      archived?: boolean
    }): Promise<T> => {
      const { database_id, ...body } = params
      return this.request<T>(`/databases/${database_id}`, { method: 'PATCH', body })
    },
  }

  // Blocks
  blocks = {
    children: {
      list: <T>(params: {
        block_id: string
        start_cursor?: string
        page_size?: number
      }): Promise<T> => {
        const { block_id, ...query } = params
        return this.request<T>(`/blocks/${block_id}/children`, {
          query: query as Record<string, string | number | undefined>,
        })
      },

      append: <T>(params: { block_id: string; children: Block[]; after?: string }): Promise<T> => {
        const { block_id, ...body } = params
        return this.request<T>(`/blocks/${block_id}/children`, { method: 'PATCH', body })
      },
    },
  }

  // Comments
  comments = {
    create: <T>(params: { parent: { page_id: string }; rich_text: RichText[] }): Promise<T> => {
      return this.request<T>('/comments', { method: 'POST', body: params })
    },
  }

  // Search
  search = <T>(params?: {
    query?: string
    filter?: { value: 'page' | 'database'; property: 'object' }
    sort?: { direction: 'ascending' | 'descending'; timestamp: 'last_edited_time' }
    start_cursor?: string
    page_size?: number
  }): Promise<T> => {
    return this.request<T>('/search', { method: 'POST', body: params || {} })
  }
}

export function createNotionClient(): NotionClient {
  const token = process.env.NOTION_TOKEN
  if (!token) {
    throw new Error(
      'NOTION_TOKEN environment variable is required. ' +
        'Please set it to your Notion integration token.',
    )
  }
  return new NotionClient({ token })
}
