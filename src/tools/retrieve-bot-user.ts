import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleError } from '../utils/index.js'

export function registerRetrieveBotUser(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'retrieve-bot-user',
    {
      description:
        'Retrieve information about the current bot user (the integration). ' +
        'Returns the bot ID, name, avatar, and owner information.',
      inputSchema: {},
    },
    async () => {
      try {
        const response = await notion.users.me({})
        return formatResponse(response)
      } catch (error) {
        return handleError(error)
      }
    },
  )
}
