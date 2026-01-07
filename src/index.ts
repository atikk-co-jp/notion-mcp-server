// Main exports

export { createNotionClient, type NotionClient } from './notion-client.js'
// Schemas
export * from './schemas/index.js'
export { startServer } from './server.js'
// Tool registration
export {
  registerAllTools,
  registerAppendBlockChildren,
  registerCreateComment,
  registerCreatePage,
  registerGetBlockChildren,
  registerQueryDataSource,
  registerRetrieveDataSource,
  registerRetrievePage,
  registerSearch,
  registerUpdateDataSource,
  registerUpdatePage,
} from './tools/index.js'
export type { McpResponse, McpTextContent } from './utils/index.js'
// Utils
export { formatResponse, formatSuccessMessage, handleError } from './utils/index.js'
