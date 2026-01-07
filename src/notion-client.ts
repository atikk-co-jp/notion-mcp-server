import type { z } from 'zod'
import type { Block } from './schemas/block.js'
import type { CoverSchema, IconSchema, RichTextSchema } from './schemas/common.js'
import type { DatabasePropertiesSchema } from './schemas/database.js'
import type { FilterSchema, SortSchema } from './schemas/filter.js'
import type { PropertyValueSchema } from './schemas/page.js'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2025-09-03'

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
      parent: { database_id: string } | { page_id: string } | { data_source_id: string }
      properties: Record<string, PropertyValue>
      children?: Block[]
      icon?: Icon
      cover?: Cover
    }): Promise<T> => {
      // API 2025-09-03 requires explicit type in parent
      let parentWithType: { type: string; [key: string]: string }
      if ('data_source_id' in params.parent) {
        parentWithType = { type: 'data_source_id', data_source_id: params.parent.data_source_id }
      } else if ('database_id' in params.parent) {
        parentWithType = { type: 'database_id', database_id: params.parent.database_id }
      } else {
        parentWithType = { type: 'page_id', page_id: params.parent.page_id }
      }
      const body = { ...params, parent: parentWithType }
      return this.request<T>('/pages', { method: 'POST', body })
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

    retrieveProperty: <T>(params: {
      page_id: string
      property_id: string
      start_cursor?: string
      page_size?: number
    }): Promise<T> => {
      const { page_id, property_id, ...query } = params
      return this.request<T>(`/pages/${page_id}/properties/${property_id}`, {
        query: query as Record<string, string | number | undefined>,
      })
    },

    move: <T>(params: {
      page_id: string
      parent: { page_id: string } | { database_id: string } | { data_source_id: string }
    }): Promise<T> => {
      // API 2025-09-03 requires explicit type in parent
      let parentWithType: { type: string; [key: string]: string }
      if ('data_source_id' in params.parent) {
        parentWithType = { type: 'data_source_id', data_source_id: params.parent.data_source_id }
      } else if ('database_id' in params.parent) {
        parentWithType = { type: 'database_id', database_id: params.parent.database_id }
      } else {
        parentWithType = { type: 'page_id', page_id: params.parent.page_id }
      }
      return this.request<T>(`/pages/${params.page_id}/move`, { method: 'POST', body: { parent: parentWithType } })
    },
  }

  // Data Sources (new in 2025-09-03)
  dataSources = {
    retrieve: <T>(params: { data_source_id: string }): Promise<T> => {
      return this.request<T>(`/data_sources/${params.data_source_id}`)
    },

    query: <T>(params: {
      data_source_id: string
      filter?: Filter
      sorts?: Sort[]
      start_cursor?: string
      page_size?: number
    }): Promise<T> => {
      const { data_source_id, ...body } = params
      return this.request<T>(`/data_sources/${data_source_id}/query`, { method: 'POST', body })
    },

    update: <T>(params: {
      data_source_id: string
      properties?: DatabaseProperties
    }): Promise<T> => {
      const { data_source_id, ...body } = params
      return this.request<T>(`/data_sources/${data_source_id}`, { method: 'PATCH', body })
    },
  }

  // Databases (container operations only in 2025-09-03)
  databases = {
    create: <T>(params: {
      parent: { page_id: string }
      title?: RichText[]
      initial_data_source?: { properties: DatabaseProperties }
      icon?: Icon
      cover?: Cover
      is_inline?: boolean
    }): Promise<T> => {
      // API 2025-09-03 requires explicit type in parent
      const body = {
        ...params,
        parent: { type: 'page_id' as const, page_id: params.parent.page_id },
      }
      return this.request<T>('/databases', { method: 'POST', body })
    },

    retrieve: <T>(params: { database_id: string }): Promise<T> => {
      return this.request<T>(`/databases/${params.database_id}`)
    },

    update: <T>(params: {
      database_id: string
      title?: RichText[]
      description?: RichText[]
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
    retrieve: <T>(params: { block_id: string }): Promise<T> => {
      return this.request<T>(`/blocks/${params.block_id}`)
    },

    update: <T>(params: { block_id: string; [key: string]: unknown }): Promise<T> => {
      const { block_id, ...body } = params
      return this.request<T>(`/blocks/${block_id}`, { method: 'PATCH', body })
    },

    delete: <T>(params: { block_id: string }): Promise<T> => {
      return this.request<T>(`/blocks/${params.block_id}`, { method: 'DELETE' })
    },

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
    create: <T>(params: {
      parent: { page_id: string }
      discussion_id?: string
      rich_text: RichText[]
    }): Promise<T> => {
      return this.request<T>('/comments', { method: 'POST', body: params })
    },

    list: <T>(params: {
      block_id?: string
      start_cursor?: string
      page_size?: number
    }): Promise<T> => {
      return this.request<T>('/comments', {
        query: params as Record<string, string | number | undefined>,
      })
    },
  }

  // Users
  users = {
    list: <T>(params?: { start_cursor?: string; page_size?: number }): Promise<T> => {
      return this.request<T>('/users', {
        query: params as Record<string, string | number | undefined>,
      })
    },

    retrieve: <T>(params: { user_id: string }): Promise<T> => {
      return this.request<T>(`/users/${params.user_id}`)
    },

    me: <T>(): Promise<T> => {
      return this.request<T>('/users/me')
    },
  }

  // Search (filter value changed from 'database' to 'data_source' in 2025-09-03)
  search = <T>(params?: {
    query?: string
    filter?: { value: 'page' | 'data_source'; property: 'object' }
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
