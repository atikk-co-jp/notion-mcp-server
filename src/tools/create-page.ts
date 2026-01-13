import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints.js'
import { z } from 'zod'
import type { NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP (full validation by Notion API)
const inputSchema = {
  parent: z
    .object({
      page_id: z.string().optional().describe(F.page_id_target),
      data_source_id: z.string().optional().describe(F.data_source_id),
    })
    .refine((obj) => obj.page_id || obj.data_source_id, {
      message: 'Either page_id or data_source_id must be provided',
    })
    .describe(F.parent),
  properties: z.record(z.string(), z.any()).describe(F.properties),
  children: z.array(z.any()).optional().describe(F.children),
  icon: z.any().optional().describe(F.icon),
  cover: z.any().optional().describe(F.cover),
}

// Types for handler input
type Parent = { page_id?: string; data_source_id?: string }
type Properties = Record<string, unknown>
type Children = unknown[]
type Icon = unknown
type Cover = unknown

export function registerCreatePage(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page',
    {
      description:
        'Create a new page in Notion. Specify parent as either page_id (to create a child page) or data_source_id (to create a database entry). ' +
        'Optionally include initial content blocks, icon, and cover image. ' +
        'Returns the created page ID and URL. (API version 2025-09-03)',
      inputSchema,
    },
    async ({ parent, properties, children, icon, cover }: {
      parent: Parent
      properties: Properties
      children?: Children
      icon?: Icon
      cover?: Cover
    }) => {
      try {
        // Build parent parameter based on which ID was provided
        const parentParam = parent.page_id
          ? { type: 'page_id' as const, page_id: parent.page_id }
          : { type: 'data_source_id' as const, data_source_id: parent.data_source_id as string }

        const params: {
          parent: typeof parentParam
          properties: Properties
          children?: Children
          icon?: Icon
          cover?: Cover
        } = {
          parent: parentParam,
          properties: properties as Properties,
        }

        if (children) {
          params.children = children as Children
        }

        if (icon) {
          params.icon = icon as Icon
        }

        if (cover) {
          params.cover = cover as Cover
        }

        const response = await notion.pages.create(params as CreatePageParameters)

        // Return minimal response (id + url only)
        return formatSimpleResponse({
          id: response.id,
          url: 'url' in response ? response.url : undefined,
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          dataSourceId: parent.data_source_id,
          exampleType: 'page',
        })
      }
    },
  )
}
