const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

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
      properties: Record<string, unknown>
      children?: unknown[]
      icon?: unknown
      cover?: unknown
    }): Promise<T> => {
      return this.request<T>('/pages', { method: 'POST', body: params })
    },

    retrieve: <T>(params: { page_id: string }): Promise<T> => {
      return this.request<T>(`/pages/${params.page_id}`)
    },

    update: <T>(params: {
      page_id: string
      properties?: Record<string, unknown>
      archived?: boolean
      icon?: unknown
      cover?: unknown
    }): Promise<T> => {
      const { page_id, ...body } = params
      return this.request<T>(`/pages/${page_id}`, { method: 'PATCH', body })
    },
  }

  // Databases
  databases = {
    query: <T>(params: {
      database_id: string
      filter?: unknown
      sorts?: unknown[]
      start_cursor?: string
      page_size?: number
    }): Promise<T> => {
      const { database_id, ...body } = params
      return this.request<T>(`/databases/${database_id}/query`, { method: 'POST', body })
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

      append: <T>(params: {
        block_id: string
        children: unknown[]
        after?: string
      }): Promise<T> => {
        const { block_id, ...body } = params
        return this.request<T>(`/blocks/${block_id}/children`, { method: 'PATCH', body })
      },
    },
  }

  // Comments
  comments = {
    create: <T>(params: { parent: { page_id: string }; rich_text: unknown[] }): Promise<T> => {
      return this.request<T>('/comments', { method: 'POST', body: params })
    },
  }

  // Search
  search = <T>(params?: {
    query?: string
    filter?: unknown
    sort?: unknown
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
