import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createNotionClient } from './notion-client.js'
import { registerAllTools } from './tools/index.js'

const PACKAGE_VERSION = '0.1.0'

export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: 'notion-mcp-server',
    version: PACKAGE_VERSION,
  })

  const notion = createNotionClient()
  registerAllTools(server, notion)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export { McpServer, StdioServerTransport }
