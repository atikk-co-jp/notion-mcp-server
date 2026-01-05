import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NotionClient } from "../notion-client.js";
import { formatResponse, handleError } from "../utils/index.js";

const inputSchema = {
  page_id: z.string().describe("The ID of the page to retrieve"),
};

export function registerRetrievePage(server: McpServer, notion: NotionClient): void {
  server.tool(
    "retrieve-page",
    "Retrieve a Notion page by its ID. Returns the page properties and metadata.",
    inputSchema,
    async ({ page_id }) => {
      try {
        const response = await notion.pages.retrieve({ page_id });
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  );
}
