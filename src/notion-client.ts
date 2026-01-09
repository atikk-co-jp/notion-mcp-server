import { Client } from '@notionhq/client'

// Type exports - use 'import type' to re-export
// Block types
// NotionClientErrorは型としてのみエクスポート（ランタイムには存在しない）
export type {
  AppendBlockChildrenParameters,
  AppendBlockChildrenResponse,
  BlockObjectRequest,
  BlockObjectResponse,
  BotUserObjectResponse,
  // Comment types
  CommentObjectResponse,
  CreateCommentParameters,
  CreateCommentResponse,
  CreateDatabaseParameters,
  CreateDatabaseResponse,
  CreateDataSourceParameters,
  CreateDataSourceResponse,
  CreatePageParameters,
  CreatePageResponse,
  // Database types
  DatabaseObjectResponse,
  // Data source types
  DataSourceObjectResponse,
  DeleteBlockParameters,
  DeleteBlockResponse,
  EquationRichTextItemResponse,
  GetBlockParameters,
  GetBlockResponse,
  GetDatabaseParameters,
  GetDatabaseResponse,
  GetDataSourceParameters,
  GetDataSourceResponse,
  GetPageParameters,
  GetPagePropertyParameters,
  GetPagePropertyResponse,
  GetPageResponse,
  GetSelfParameters,
  GetSelfResponse,
  GetUserParameters,
  GetUserResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse,
  ListCommentsParameters,
  ListCommentsResponse,
  ListUsersParameters,
  ListUsersResponse,
  MentionRichTextItemResponse,
  MovePageParameters,
  MovePageResponse,
  NotionClientError,
  // Page types
  PageObjectResponse,
  PartialBlockObjectResponse,
  PartialCommentObjectResponse,
  PartialDatabaseObjectResponse,
  PartialDataSourceObjectResponse,
  PartialPageObjectResponse,
  PartialUserObjectResponse,
  PersonUserObjectResponse,
  PropertyItemListResponse,
  // Property item types
  PropertyItemObjectResponse,
  QueryDataSourceParameters,
  QueryDataSourceResponse,
  // Rich text types
  RichTextItemResponse,
  // Search types
  SearchParameters,
  SearchResponse,
  TextRichTextItemResponse,
  UpdateBlockParameters,
  UpdateBlockResponse,
  UpdateDatabaseParameters,
  UpdateDatabaseResponse,
  UpdateDataSourceParameters,
  UpdateDataSourceResponse,
  UpdatePageParameters,
  UpdatePageResponse,
  // User types
  UserObjectResponse,
} from '@notionhq/client'
// Re-export official SDK Client
// Re-export helper functions
// Re-export error types
export {
  APIResponseError,
  Client as NotionClient,
  collectPaginatedAPI,
  isFullBlock,
  isFullComment,
  isFullDatabase,
  isFullDataSource,
  isFullPage,
  isFullUser,
  isNotionClientError,
  iteratePaginatedAPI,
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
