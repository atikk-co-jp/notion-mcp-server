import { Client } from '@notionhq/client'

// Re-export official SDK Client
export { Client as NotionClient } from '@notionhq/client'

// Type exports - use 'import type' to re-export
// Block types
export type {
  BlockObjectRequest,
  BlockObjectResponse,
  PartialBlockObjectResponse,
  AppendBlockChildrenParameters,
  AppendBlockChildrenResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  GetBlockParameters,
  GetBlockResponse,
  UpdateBlockParameters,
  UpdateBlockResponse,
  DeleteBlockParameters,
  DeleteBlockResponse,
  // Page types
  PageObjectResponse,
  PartialPageObjectResponse,
  CreatePageParameters,
  CreatePageResponse,
  GetPageParameters,
  GetPageResponse,
  UpdatePageParameters,
  UpdatePageResponse,
  MovePageParameters,
  MovePageResponse,
  GetPagePropertyParameters,
  GetPagePropertyResponse,
  // Database types
  DatabaseObjectResponse,
  PartialDatabaseObjectResponse,
  CreateDatabaseParameters,
  CreateDatabaseResponse,
  GetDatabaseParameters,
  GetDatabaseResponse,
  UpdateDatabaseParameters,
  UpdateDatabaseResponse,
  // Data source types
  DataSourceObjectResponse,
  PartialDataSourceObjectResponse,
  GetDataSourceParameters,
  GetDataSourceResponse,
  QueryDataSourceParameters,
  QueryDataSourceResponse,
  UpdateDataSourceParameters,
  UpdateDataSourceResponse,
  CreateDataSourceParameters,
  CreateDataSourceResponse,
  // Comment types
  CommentObjectResponse,
  PartialCommentObjectResponse,
  CreateCommentParameters,
  CreateCommentResponse,
  ListCommentsParameters,
  ListCommentsResponse,
  // User types
  UserObjectResponse,
  PartialUserObjectResponse,
  BotUserObjectResponse,
  PersonUserObjectResponse,
  GetUserParameters,
  GetUserResponse,
  ListUsersParameters,
  ListUsersResponse,
  GetSelfParameters,
  GetSelfResponse,
  // Search types
  SearchParameters,
  SearchResponse,
  // Rich text types
  RichTextItemResponse,
  TextRichTextItemResponse,
  MentionRichTextItemResponse,
  EquationRichTextItemResponse,
  // Property item types
  PropertyItemObjectResponse,
  PropertyItemListResponse,
} from '@notionhq/client'

// Re-export helper functions
export {
  isFullBlock,
  isFullPage,
  isFullDatabase,
  isFullDataSource,
  isFullUser,
  isFullComment,
  collectPaginatedAPI,
  iteratePaginatedAPI,
} from '@notionhq/client'

// Re-export error types
export {
  isNotionClientError,
  APIResponseError,
  NotionClientError,
} from '@notionhq/client'

export interface NotionClientOptions {
  token: string
}

export function createNotionClient(): Client {
  const token = process.env.NOTION_TOKEN
  if (!token) {
    throw new Error(
      'NOTION_TOKEN environment variable is required. ' +
        'Please set it to your Notion integration token.',
    )
  }
  return new Client({ auth: token })
}
