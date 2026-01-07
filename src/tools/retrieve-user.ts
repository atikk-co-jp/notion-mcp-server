import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

const inputSchema = {
  user_id: z.string().describe('User ID'),
}

export function registerRetrieveUser(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-user',
    {
      description:
        'Retrieve a user by their ID. Returns user information including name, avatar, and type (person or bot).',
      inputSchema,
    },
    async ({ user_id }) => {
      try {
        const response = await notion.users.retrieve({ user_id })
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
