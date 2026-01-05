import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NotionClient } from "../notion-client.js";
import { formatResponse, handleError } from "../utils/index.js";

const inputSchema = {
  block_id: z.string().describe("The ID of the block or page to append children to"),
  children: z
    .array(z.any())
    .describe(
      "Array of block objects to append. " +
        'Example: [{ "type": "paragraph", "paragraph": { "rich_text": [{ "text": { "content": "Hello" } }] } }]',
    ),
  after: z
    .string()
    .optional()
    .describe(
      "The ID of a block to insert the new children after. " +
        "If not provided, children are appended at the end.",
    ),
};

export function registerAppendBlockChildren(server: McpServer, notion: NotionClient): void {
  server.tool(
    "append-block-children",
    "Append new blocks as children to a block or page.",
    inputSchema,
    async ({ block_id, children, after }) => {
      try {
        const params: {
          block_id: string;
          children: unknown[];
          after?: string;
        } = {
          block_id,
          children,
        };

        if (after) {
          params.after = after;
        }

        const response = await notion.blocks.children.append(params);
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  );
}
