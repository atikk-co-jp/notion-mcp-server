import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BlockObjectRequest, CreatePageParameters } from '@notionhq/client'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import { isFullDataSource, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP
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
  title: z.string().describe(F.title),
  content: z.string().optional().describe(F.content),
  properties: z.record(z.string(), z.any()).optional().describe(F.properties),
  icon: z.string().optional().describe(F.icon_emoji),
}

// Types for handler input
type Parent = { page_id?: string; data_source_id?: string }
type Properties = Record<string, unknown>

export function registerCreatePageSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page-simple',
    {
      description:
        'Create a page with Markdown. Specify parent as either page_id (child page) or data_source_id (database entry). ' +
        'Title is auto-mapped to the title property. ' +
        F.markdown_syntax_short,
      inputSchema,
    },
    async ({ parent, title, content, properties, icon }: {
      parent: Parent
      title: string
      content?: string
      properties?: Properties
      icon?: string
    }) => {
      try {
        // Build parent parameter based on which ID was provided
        const parentParam = parent.page_id
          ? { type: 'page_id' as const, page_id: parent.page_id }
          : { type: 'data_source_id' as const, data_source_id: parent.data_source_id as string }

        // Determine title property name
        let titlePropertyName: string = 'title' // Default for page parent

        // For data_source parent, try to fetch schema to find the title property name
        if (parent.data_source_id) {
          titlePropertyName = 'Name' // Default fallback for database
          try {
            const schema = await notion.dataSources.retrieve({ data_source_id: parent.data_source_id })
            if (isFullDataSource(schema)) {
              // Find the title property name from schema
              const foundTitleProp = Object.entries(schema.properties).find(
                ([, prop]) => prop.type === 'title',
              )
              if (foundTitleProp) {
                titlePropertyName = foundTitleProp[0]
              }
            }
          } catch {
            // If schema fetch fails, fall back to 'Name'
          }
        }

        // Build properties with title
        const pageProperties: Properties = {
          ...(properties as Properties),
        }

        // Check if any title property is already provided
        // Title properties have the structure: { title: [...] }
        const hasTitleProperty = Object.values(pageProperties).some(
          (prop) => prop && typeof prop === 'object' && 'title' in (prop as object),
        )

        // Add title property if not already provided
        if (!hasTitleProperty) {
          pageProperties[titlePropertyName] = {
            title: [{ type: 'text', text: { content: title } }],
          }
        }

        // Cast markdownToBlocks output to SDK's BlockObjectRequest type
        const children = content
          ? (markdownToBlocks(content) as unknown as BlockObjectRequest[])
          : undefined

        const response = await notion.pages.create({
          parent: parentParam,
          properties: pageProperties,
          ...(children && { children }),
          ...(icon && { icon: { type: 'emoji' as const, emoji: icon } }),
        } as CreatePageParameters)

        // Return minimal response (id + url only)
        return formatSimpleResponse({
          id: response.id,
          url: 'url' in response ? response.url : undefined,
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          dataSourceId: parent.data_source_id,
          exampleType: 'page',
          hint:
            'Hint: The "title" parameter automatically sets the title property. ' +
            'Use "properties" for other fields like select or multi_select.',
        })
      }
    },
  )
}
