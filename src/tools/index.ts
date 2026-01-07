import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { NotionClient } from '../notion-client.js'
import { registerAppendBlockChildren } from './append-block-children.js'
import { registerAppendBlocksSimple } from './append-blocks-simple.js'
import { registerCreateComment } from './create-comment.js'
import { registerCreateDatabase } from './create-database.js'
import { registerCreatePage } from './create-page.js'
import { registerCreatePageSimple } from './create-page-simple.js'
import { registerDeleteBlock } from './delete-block.js'
import { registerGetBlockChildren } from './get-block-children.js'
import { registerListComments } from './list-comments.js'
import { registerListUsers } from './list-users.js'
import { registerMovePage } from './move-page.js'
import { registerQueryDatabase } from './query-database.js'
import { registerRetrieveBlock } from './retrieve-block.js'
import { registerRetrieveBotUser } from './retrieve-bot-user.js'
import { registerRetrieveDatabase } from './retrieve-database.js'
import { registerRetrievePage } from './retrieve-page.js'
import { registerRetrievePageProperty } from './retrieve-page-property.js'
import { registerRetrieveUser } from './retrieve-user.js'
import { registerSearch } from './search.js'
import { registerUpdateBlock } from './update-block.js'
import { registerUpdateBlockSimple } from './update-block-simple.js'
import { registerUpdateDatabase } from './update-database.js'
import { registerUpdatePage } from './update-page.js'

export function registerAllTools(server: McpServer, notion: NotionClient): void {
  // Page operations
  registerRetrievePage(server, notion)
  registerCreatePage(server, notion)
  registerCreatePageSimple(server, notion)
  registerUpdatePage(server, notion)
  registerRetrievePageProperty(server, notion)
  registerMovePage(server, notion)

  // Database operations
  registerCreateDatabase(server, notion)
  registerUpdateDatabase(server, notion)
  registerQueryDatabase(server, notion)
  registerRetrieveDatabase(server, notion)

  // Search
  registerSearch(server, notion)

  // Block operations
  registerGetBlockChildren(server, notion)
  registerAppendBlockChildren(server, notion)
  registerAppendBlocksSimple(server, notion)
  registerRetrieveBlock(server, notion)
  registerUpdateBlock(server, notion)
  registerUpdateBlockSimple(server, notion)
  registerDeleteBlock(server, notion)

  // Comment operations
  registerCreateComment(server, notion)
  registerListComments(server, notion)

  // User operations
  registerListUsers(server, notion)
  registerRetrieveUser(server, notion)
  registerRetrieveBotUser(server, notion)
}

export {
  registerRetrievePage,
  registerCreatePage,
  registerCreatePageSimple,
  registerUpdatePage,
  registerRetrievePageProperty,
  registerMovePage,
  registerCreateDatabase,
  registerUpdateDatabase,
  registerQueryDatabase,
  registerRetrieveDatabase,
  registerSearch,
  registerGetBlockChildren,
  registerAppendBlockChildren,
  registerAppendBlocksSimple,
  registerRetrieveBlock,
  registerUpdateBlock,
  registerUpdateBlockSimple,
  registerDeleteBlock,
  registerCreateComment,
  registerListComments,
  registerListUsers,
  registerRetrieveUser,
  registerRetrieveBotUser,
}
