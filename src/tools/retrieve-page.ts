import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type NotionProperty, pageToSimple } from "../converters/index.js";
import type { NotionClient } from "../notion-client.js";
import { formatResponse, formatSimpleResponse, handleError } from "../utils/index.js";

interface PageResponse {
  id: string;
  url?: string;
  properties: Record<string, NotionProperty>;
  [key: string]: unknown;
}

const inputSchema = {
  page_id: z.string().describe("The ID of the page to retrieve"),
  format: z
    .enum(["json", "simple"])
    .optional()
    .default("simple")
    .describe(
      "Output format: 'simple' (default) returns simplified property values with reduced token usage, 'json' returns raw Notion API response",
    ),
};

export function registerRetrievePage(server: McpServer, notion: NotionClient): void {
  server.tool(
    "retrieve-page",
    "Retrieve a Notion page by its ID. Returns the page properties and metadata. Use format='simple' (default) for human-readable output with reduced token usage.",
    inputSchema,
    async ({ page_id, format }) => {
      try {
        const response = await notion.pages.retrieve<PageResponse>({ page_id });

        if (format === "simple") {
          const simple = pageToSimple(response);
          return formatSimpleResponse(simple);
        }

        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  );
}
