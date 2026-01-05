import type { McpResponse } from "./error-handler.js";

export function formatResponse(data: unknown): McpResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function formatSuccessMessage(message: string): McpResponse {
  return {
    content: [{ type: "text", text: message }],
  };
}

export function formatPaginatedResponse(
  data: unknown,
  hasMore: boolean,
  nextCursor: string | null,
): McpResponse {
  const result = {
    data,
    has_more: hasMore,
    next_cursor: nextCursor,
  };
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
