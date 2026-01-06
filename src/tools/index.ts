import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { NotionClient } from '../notion-client.js'
import { registerAppendBlockChildren } from './append-block-children.js'
import { registerCreateComment } from './create-comment.js'
import { registerCreateDatabase } from './create-database.js'
import { registerCreatePage } from './create-page.js'
import { registerGetBlockChildren } from './get-block-children.js'
import { registerQueryDatabase } from './query-database.js'
import { registerRetrievePage } from './retrieve-page.js'
import { registerSearch } from './search.js'
import { registerUpdateDatabase } from './update-database.js'
import { registerUpdatePage } from './update-page.js'

export function registerAllTools(server: McpServer, notion: NotionClient): void {
  // Page operations
  registerRetrievePage(server, notion)
  registerCreatePage(server, notion)
  registerUpdatePage(server, notion)

  // Database operations
  registerCreateDatabase(server, notion)
  registerUpdateDatabase(server, notion)
  registerQueryDatabase(server, notion)

  // Search
  registerSearch(server, notion)

  // Block operations
  registerGetBlockChildren(server, notion)
  registerAppendBlockChildren(server, notion)

  // Comment operations
  registerCreateComment(server, notion)
}

export {
  registerRetrievePage,
  registerCreatePage,
  registerUpdatePage,
  registerCreateDatabase,
  registerUpdateDatabase,
  registerQueryDatabase,
  registerSearch,
  registerGetBlockChildren,
  registerAppendBlockChildren,
  registerCreateComment,
}
