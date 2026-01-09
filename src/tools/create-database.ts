import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CreateDatabaseParameters } from '@notionhq/client/build/src/api-endpoints.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
// Uses z.any() for title/icon/cover to reduce context size (~2,300 tokens saved)
const inputSchema = {
  parent_page_id: z.string().describe(F.parent_page_id),
  title: z.any().optional().describe(F.title),
  properties: z.record(z.string(), z.any()).describe(F.properties_schema),
  icon: z.any().optional().describe(F.icon),
  cover: z.any().optional().describe(F.cover),
  is_inline: z.boolean().optional().describe(F.is_inline),
}

export function registerCreateDatabase(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-database',
    {
      description:
        'Create a new database as a subpage of an existing Notion page. ' +
        'Requires a parent_page_id and properties object defining the database schema. ' +
        'Each database must have exactly one title property. ' +
        'Returns database ID and URL. (API version 2025-09-03)',
      inputSchema,
    },
    async ({ parent_page_id, title, properties, icon, cover, is_inline }) => {
      try {
        // Build params with only defined values (API validates full structure)
        const params = {
          parent: { type: 'page_id' as const, page_id: parent_page_id },
          initial_data_source: { properties },
          ...(title !== undefined && { title }),
          ...(icon !== undefined && { icon }),
          ...(cover !== undefined && { cover }),
          ...(is_inline !== undefined && { is_inline }),
        }

        const response = await notion.databases.create(params as CreateDatabaseParameters)

        // Return minimal response (id + url only)
        return formatSimpleResponse({
          id: response.id,
          url: 'url' in response ? response.url : undefined,
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          exampleType: 'schema',
        })
      }
    },
  )
}
