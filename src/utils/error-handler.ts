import { isFullDataSource, type NotionClient } from '../notion-client.js'
import {
  type ExampleType,
  PagePropertyExamples,
  SchemaPropertyExamples,
  getExamplesByType,
} from '../schemas/descriptions/index.js'

interface DataSourceProperty {
  type: string
  [key: string]: unknown
}

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
  return error.message.includes('validation_error')
}

function formatPropertyList(
  properties: Record<string, DataSourceProperty>,
  exampleType: 'page' | 'schema',
): string {
  const propList = Object.entries(properties)
    .map(([name, prop]) => `  - ${name} (${prop.type})`)
    .join('\n')

  // Get unique property types and their examples based on exampleType
  const examples = exampleType === 'page' ? PagePropertyExamples : SchemaPropertyExamples
  const uniqueTypes = [...new Set(Object.values(properties).map((p) => p.type))]
  const exampleLines = uniqueTypes
    .filter((type) => examples[type])
    .slice(0, 5) // Limit to 5 examples to save tokens
    .map((type) => `  ${type}: ${examples[type]}`)
    .join('\n')

  if (exampleLines) {
    const label = exampleType === 'page' ? 'Page property' : 'Schema property'
    return `${propList}\n\n${label} format examples:\n${exampleLines}`
  }
  return propList
}

export interface HandleErrorOptions {
  /** Data source ID to fetch schema for property list */
  dataSourceId?: string
  /** Type of examples to show */
  exampleType?: ExampleType
  /** Additional hint to append (e.g., usage examples) */
  hint?: string
}

/**
 * Enhanced error handler that includes contextual help for validation errors.
 *
 * Usage:
 * - Page tools: handleErrorWithContext(error, notion, { dataSourceId, exampleType: 'page' })
 * - Schema tools: handleErrorWithContext(error, notion, { dataSourceId, exampleType: 'schema' })
 * - Block tools: handleErrorWithContext(error, notion, { exampleType: 'block' })
 * - Filter tools: handleErrorWithContext(error, notion, { exampleType: 'filter' })
 */
export async function handleErrorWithContext(
  error: unknown,
  notion: NotionClient,
  options?: HandleErrorOptions,
): Promise<McpResponse> {
  const baseResponse = handleError(error)

  if (!isValidationError(error)) {
    return baseResponse
  }

  // For data source related errors, fetch and show property list
  if (options?.dataSourceId && (options.exampleType === 'page' || options.exampleType === 'schema')) {
    try {
      const schema = await notion.dataSources.retrieve({ data_source_id: options.dataSourceId })
      if (isFullDataSource(schema)) {
        const propList = formatPropertyList(
          schema.properties as unknown as Record<string, DataSourceProperty>,
          options.exampleType
        )
        baseResponse.content[0].text += `\n\nAvailable properties:\n${propList}`
      }
    } catch {
      // Ignore schema fetch errors - still show examples below
    }
  }

  // For other types (block, richTextArray, filter), show examples directly
  if (options?.exampleType && options.exampleType !== 'page' && options.exampleType !== 'schema') {
    const examples = getExamplesByType(options.exampleType)
    baseResponse.content[0].text += `\n\n${examples}`
  }

  // Add optional hint
  if (options?.hint) {
    baseResponse.content[0].text += `\n\n${options.hint}`
  }

  return baseResponse
}

