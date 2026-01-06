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

/**
 * マークダウン形式のレスポンスをフォーマット
 */
export function formatMarkdownResponse(
  markdown: string,
  hasMore: boolean,
  nextCursor: string | null,
): McpResponse {
  let text = markdown;
  if (hasMore && nextCursor) {
    text += `\n\n---\n_More content available. Use next_cursor: "${nextCursor}" to continue._`;
  }
  return {
    content: [{ type: "text", text }],
  };
}

/**
 * シンプル形式のレスポンスをフォーマット（JSONだがコンパクト）
 */
export function formatSimpleResponse(data: unknown): McpResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * シンプル形式のページネーションレスポンスをフォーマット
 */
export function formatSimplePaginatedResponse(
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
