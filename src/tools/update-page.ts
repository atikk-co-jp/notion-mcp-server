import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NotionClient } from "../notion-client.js";
import { formatResponse, handleError } from "../utils/index.js";

const inputSchema = {
  page_id: z.string().describe("The ID of the page to update"),
  properties: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Properties to update as a JSON object. Keys are property names, values are property values. " +
        'Example: { "Status": { "status": { "name": "Done" } } }',
    ),
  archived: z.boolean().optional().describe("Set to true to archive (delete) the page"),
  icon: z
    .any()
    .optional()
    .describe(
      "Optional icon for the page. " +
        'Emoji example: { "type": "emoji", "emoji": "🚀" }. ' +
        "Set to null to remove the icon.",
    ),
  cover: z
    .any()
    .optional()
    .describe(
      "Optional cover image for the page. " +
        'Example: { "type": "external", "external": { "url": "https://..." } }. ' +
        "Set to null to remove the cover.",
    ),
};

export function registerUpdatePage(server: McpServer, notion: NotionClient): void {
  server.tool(
    "update-page",
    "Update a Notion page's properties, icon, cover, or archive status.",
    inputSchema,
    async ({ page_id, properties, archived, icon, cover }) => {
      try {
        const params: {
          page_id: string;
          properties?: Record<string, unknown>;
          archived?: boolean;
          icon?: unknown;
          cover?: unknown;
        } = { page_id };

        if (properties !== undefined) {
          params.properties = properties;
        }

        if (archived !== undefined) {
          params.archived = archived;
        }

        if (icon !== undefined) {
          params.icon = icon;
        }

        if (cover !== undefined) {
          params.cover = cover;
        }

        const response = await notion.pages.update(params);
        return formatResponse(response);
      } catch (error) {
        return handleError(error);
      }
    },
  );
}
