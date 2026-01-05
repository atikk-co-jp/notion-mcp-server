export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpResponse {
  [key: string]: unknown;
  content: McpTextContent[];
  isError?: boolean;
}

interface NotionApiError {
  code: string;
  message: string;
}

function isNotionApiError(error: unknown): error is Error & NotionApiError {
  if (!(error instanceof Error)) return false;
  const errObj = error as unknown as Record<string, unknown>;
  return typeof errObj.code === "string" && typeof errObj.message === "string";
}

export function handleError(error: unknown): McpResponse {
  if (isNotionApiError(error)) {
    const message = formatNotionError(error);
    return {
      content: [{ type: "text", text: `Notion API Error: ${message}` }],
      isError: true,
    };
  }

  if (error instanceof Error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }

  return {
    content: [{ type: "text", text: `Unknown error: ${String(error)}` }],
    isError: true,
  };
}

// Notion API error codes
const NOTION_ERROR_CODES = {
  object_not_found: "object_not_found",
  unauthorized: "unauthorized",
  rate_limited: "rate_limited",
  invalid_json: "invalid_json",
  invalid_request_url: "invalid_request_url",
  invalid_request: "invalid_request",
  validation_error: "validation_error",
  conflict_error: "conflict_error",
  internal_server_error: "internal_server_error",
  service_unavailable: "service_unavailable",
} as const;

function formatNotionError(error: NotionApiError): string {
  switch (error.code) {
    case NOTION_ERROR_CODES.object_not_found:
      return `Object not found. Please check the ID is correct and the integration has access. Details: ${error.message}`;
    case NOTION_ERROR_CODES.unauthorized:
      return `Unauthorized. Please check your NOTION_TOKEN is valid and has the required permissions. Details: ${error.message}`;
    case NOTION_ERROR_CODES.rate_limited:
      return `Rate limited. Please wait and retry. Details: ${error.message}`;
    case NOTION_ERROR_CODES.invalid_json:
      return `Invalid JSON in request. Details: ${error.message}`;
    case NOTION_ERROR_CODES.invalid_request_url:
      return `Invalid request URL. Details: ${error.message}`;
    case NOTION_ERROR_CODES.invalid_request:
      return `Invalid request. Details: ${error.message}`;
    case NOTION_ERROR_CODES.validation_error:
      return `Validation error: ${error.message}`;
    case NOTION_ERROR_CODES.conflict_error:
      return `Conflict error. The resource may have been modified. Details: ${error.message}`;
    case NOTION_ERROR_CODES.internal_server_error:
      return `Notion internal server error. Please retry later. Details: ${error.message}`;
    case NOTION_ERROR_CODES.service_unavailable:
      return `Notion service unavailable. Please retry later. Details: ${error.message}`;
    default:
      return error.message;
  }
}
