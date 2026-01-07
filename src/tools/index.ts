import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { NotionClient } from '../notion-client.js'
import { registerAppendBlockChildren } from './append-block-children.js'
import { registerAppendBlocksSimple } from './append-blocks-simple.js'
import { registerArchiveDatabase } from './archive-database.js'
import { registerArchivePage } from './archive-page.js'
import { registerCreateComment } from './create-comment.js'
import { registerCreateDatabase } from './create-database.js'
import { registerCreatePage } from './create-page.js'
import { registerCreatePageSimple } from './create-page-simple.js'
import { registerDeleteBlock } from './delete-block.js'
import { registerGetBlockChildren } from './get-block-children.js'
import { registerListComments } from './list-comments.js'
import { registerListUsers } from './list-users.js'
import { registerMovePage } from './move-page.js'
import { registerQueryDataSource } from './query-data-source.js'
import { registerRetrieveBlock } from './retrieve-block.js'
import { registerRetrieveBotUser } from './retrieve-bot-user.js'
import { registerRetrieveDatabase } from './retrieve-database.js'
import { registerRetrieveDataSource } from './retrieve-data-source.js'
import { registerRetrievePage } from './retrieve-page.js'
import { registerRetrievePageProperty } from './retrieve-page-property.js'
import { registerRetrieveUser } from './retrieve-user.js'
import { registerSearch } from './search.js'
import { registerUpdateBlock } from './update-block.js'
import { registerUpdateBlockSimple } from './update-block-simple.js'
import { registerUpdateDatabase } from './update-database.js'
import { registerUpdateDataSource } from './update-data-source.js'
import { registerUpdatePage } from './update-page.js'

export function registerAllTools(server: McpServer, notion: NotionClient): void {
  // Page operations
  registerRetrievePage(server, notion)
  registerCreatePage(server, notion)
  registerCreatePageSimple(server, notion)
  registerUpdatePage(server, notion)
  registerArchivePage(server, notion)
  registerRetrievePageProperty(server, notion)
  registerMovePage(server, notion)

  // Database operations
  registerCreateDatabase(server, notion)
  registerUpdateDatabase(server, notion)
  registerArchiveDatabase(server, notion)
  registerRetrieveDatabase(server, notion)

  // Data Source operations (API 2025-09-03)
  registerRetrieveDataSource(server, notion)
  registerQueryDataSource(server, notion)
  registerUpdateDataSource(server, notion)

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
  registerArchivePage,
  registerRetrievePageProperty,
  registerMovePage,
  registerCreateDatabase,
  registerUpdateDatabase,
  registerArchiveDatabase,
  registerRetrieveDatabase,
  registerRetrieveDataSource,
  registerQueryDataSource,
  registerUpdateDataSource,
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
