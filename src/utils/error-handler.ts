import type { NotionClient } from '../notion-client.js'

export interface McpTextContent {
  type: 'text'
  text: string
}

export interface McpResponse {
  [key: string]: unknown
  content: McpTextContent[]
  isError?: boolean
}

interface NotionApiError {
  code: string
  message: string
}

interface DataSourceProperty {
  type: string
  [key: string]: unknown
}

function isNotionApiError(error: unknown): error is Error & NotionApiError {
  if (!(error instanceof Error)) return false
  const errObj = error as unknown as Record<string, unknown>
  return typeof errObj.code === 'string' && typeof errObj.message === 'string'
}

export function handleError(error: unknown): McpResponse {
  if (isNotionApiError(error)) {
    const message = formatNotionError(error)
    return {
      content: [{ type: 'text', text: `Notion API Error: ${message}` }],
      isError: true,
    }
  }

  if (error instanceof Error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    }
  }

  return {
    content: [{ type: 'text', text: `Unknown error: ${String(error)}` }],
    isError: true,
  }
}

// Notion API error codes
const NOTION_ERROR_CODES = {
  object_not_found: 'object_not_found',
  unauthorized: 'unauthorized',
  rate_limited: 'rate_limited',
  invalid_json: 'invalid_json',
  invalid_request_url: 'invalid_request_url',
  invalid_request: 'invalid_request',
  validation_error: 'validation_error',
  conflict_error: 'conflict_error',
  internal_server_error: 'internal_server_error',
  service_unavailable: 'service_unavailable',
} as const

function formatNotionError(error: NotionApiError): string {
  switch (error.code) {
    case NOTION_ERROR_CODES.object_not_found:
      return `Object not found. Please check the ID is correct and the integration has access. Details: ${error.message}`
    case NOTION_ERROR_CODES.unauthorized:
      return `Unauthorized. Please check your NOTION_TOKEN is valid and has the required permissions. Details: ${error.message}`
    case NOTION_ERROR_CODES.rate_limited:
      return `Rate limited. Please wait and retry. Details: ${error.message}`
    case NOTION_ERROR_CODES.invalid_json:
      return `Invalid JSON in request. Details: ${error.message}`
    case NOTION_ERROR_CODES.invalid_request_url:
      return `Invalid request URL. Details: ${error.message}`
    case NOTION_ERROR_CODES.invalid_request:
      return `Invalid request. Details: ${error.message}`
    case NOTION_ERROR_CODES.validation_error:
      return `Validation error: ${error.message}`
    case NOTION_ERROR_CODES.conflict_error:
      return `Conflict error. The resource may have been modified. Details: ${error.message}`
    case NOTION_ERROR_CODES.internal_server_error:
      return `Notion internal server error. Please retry later. Details: ${error.message}`
    case NOTION_ERROR_CODES.service_unavailable:
      return `Notion service unavailable. Please retry later. Details: ${error.message}`
    default:
      return error.message
  }
}

function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  // Check if error message contains validation_error code
  return error.message.includes('validation_error')
}

function formatPropertyList(properties: Record<string, DataSourceProperty>): string {
  return Object.entries(properties)
    .map(([name, prop]) => `  - ${name} (${prop.type})`)
    .join('\n')
}

interface DataSourceResponse {
  properties: Record<string, DataSourceProperty>
}

interface HandleErrorOptions {
  /** Additional hint to append after property list (e.g., usage examples) */
  hint?: string
}

/**
 * Enhanced error handler that includes available properties for validation errors.
 * Use this for tools that operate on data sources (create-page, update-page, etc.)
 */
export async function handleErrorWithContext(
  error: unknown,
  notion: NotionClient,
  dataSourceId?: string,
  options?: HandleErrorOptions,
): Promise<McpResponse> {
  const baseResponse = handleError(error)

  // For validation errors with a data source ID, append available properties
  if (isValidationError(error) && dataSourceId) {
    try {
      const schema = await notion.dataSources.retrieve<DataSourceResponse>({
        data_source_id: dataSourceId,
      })
      const propList = formatPropertyList(schema.properties)
      baseResponse.content[0].text += `\n\nAvailable properties:\n${propList}`

      // Add optional hint
      if (options?.hint) {
        baseResponse.content[0].text += `\n\n${options.hint}`
      }
    } catch {
      // Ignore schema fetch errors - keep the original error message
    }
  }

  return baseResponse
}
