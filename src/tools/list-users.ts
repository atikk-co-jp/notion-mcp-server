import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatPaginatedResponse, handleError } from '../utils/index.js'

const inputSchema = {
  start_cursor: z.string().optional().describe('Pagination cursor'),
  page_size: z.number().optional().describe('Number of results (1-100)'),
}

interface UserListResponse {
  object: 'list'
  results: Array<{
    object: 'user'
    id: string
    type: 'person' | 'bot'
    name: string | null
    avatar_url: string | null
    person?: { email: string }
    bot?: { owner: { type: string } }
  }>
  next_cursor: string | null
  has_more: boolean
}

export function registerListUsers(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'list-users',
    {
      description:
        'List all users in the workspace. Returns paginated list of users with their IDs, names, and types (person or bot).',
      inputSchema,
    },
    async ({ start_cursor, page_size }) => {
      try {
        const response = await notion.users.list<UserListResponse>({
          start_cursor,
          page_size,
        })

        // Format users with essential info
        const users = response.results.map((user) => ({
          id: user.id,
          type: user.type,
          name: user.name,
          avatar_url: user.avatar_url,
          email: user.person?.email,
        }))

        return formatPaginatedResponse(users, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
