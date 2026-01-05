import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NotionClient } from "../notion-client.js";
import { formatResponse, handleError } from "../utils/index.js";

const inputSchema = {
  database_id: z.string().describe("The ID of the database where the page will be created"),
  properties: z
    .record(z.string(), z.any())
    .describe(
      "Page properties as a JSON object. Keys are property names, values are property values. " +
        'Example: { "Name": { "title": [{ "text": { "content": "My Page" } }] }, ' +
        '"Status": { "status": { "name": "In Progress" } } }',
    ),
  children: z
    .array(z.any())
    .optional()
    .describe(
      "Optional array of block objects for the page content. " +
        'Example: [{ "type": "paragraph", "paragraph": { "rich_text": [{ "text": { "content": "Hello" } }] } }]',
    ),
  icon: z
    .any()
    .optional()
    .describe(
      "Optional icon for the page. " +
        'Emoji example: { "type": "emoji", "emoji": "🚀" }. ' +
        'External example: { "type": "external", "external": { "url": "https://..." } }',
    ),
  cover: z
    .any()
    .optional()
    .describe(
      "Optional cover image for the page. " +
        'Example: { "type": "external", "external": { "url": "https://..." } }',
    ),
};

export function registerCreatePage(server: McpServer, notion: NotionClient): void {
  server.tool(
    "create-page",
    "Create a new page in a Notion database. Requires a database_id and properties object.",
    inputSchema,
    async ({ database_id, properties, children, icon, cover }) => {
      try {
        const params: {
          parent: { database_id: string };
          properties: Record<string, unknown>;
          children?: unknown[];
          icon?: unknown;
          cover?: unknown;
        } = {
          parent: { database_id },
          properties,
        };

        if (children) {
          params.children = children;
        }

        if (icon) {
          params.icon = icon;
        }

        if (cover) {
          params.cover = cover;
        }

        const response = await notion.pages.create(params);
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  );
}
