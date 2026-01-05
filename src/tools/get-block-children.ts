import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NotionClient } from "../notion-client.js";
import { formatPaginatedResponse, handleError } from "../utils/index.js";

interface PaginatedResponse {
  results: unknown[];
  has_more: boolean;
  next_cursor: string | null;
}

const inputSchema = {
  block_id: z.string().describe("The ID of the block or page to get children from"),
  start_cursor: z
    .string()
    .optional()
    .describe("Cursor for pagination. Use the next_cursor from previous response."),
  page_size: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Number of results to return (1-100). Default is 100."),
};

export function registerGetBlockChildren(server: McpServer, notion: NotionClient): void {
  server.tool(
    "get-block-children",
    "Retrieve the children blocks of a block or page. Returns paginated results.",
    inputSchema,
    async ({ block_id, start_cursor, page_size }) => {
      try {
        const response = await notion.blocks.children.list<PaginatedResponse>({
          block_id,
          start_cursor,
          page_size,
        });
        return formatPaginatedResponse(response.results, response.has_more, response.next_cursor);
      } catch (error) {
        return handleError(error);
      }
    },
  );
}
