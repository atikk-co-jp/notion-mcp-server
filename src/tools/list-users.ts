import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatPaginatedResponse, handleError } from '../utils/index.js'

const inputSchema = {
  start_cursor: z.string().optional().describe(F.start_cursor),
  page_size: z.number().optional().describe(F.page_size),
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
        const response = await notion.users.list({
          start_cursor,
          page_size,
        })

        // Format users with essential info
        const users = response.results.map((user) => ({
          id: user.id,
          type: user.type,
          name: user.name,
          avatar_url: user.avatar_url,
          email: user.type === 'person' ? user.person.email : undefined,
        }))

        return formatPaginatedResponse(users, response.has_more, response.next_cursor)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
