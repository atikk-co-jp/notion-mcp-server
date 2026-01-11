import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BlockObjectRequest } from '@notionhq/client'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import { isFullDataSource, type NotionClient } from '../notion-client.js'
import { F } from '../schemas/descriptions/index.js'
import { formatSimpleResponse, handleErrorWithContext } from '../utils/index.js'

// Minimal schema for MCP
const inputSchema = {
  data_source_id: z.string().describe(F.data_source_id),
  title: z.string().describe(F.title),
  content: z.string().optional().describe(F.content),
  properties: z.record(z.string(), z.any()).optional().describe(F.properties),
  icon: z.string().optional().describe(F.icon_emoji),
}

// Types derived from inputSchema - guaranteed to match
type Input = { [K in keyof typeof inputSchema]: z.infer<(typeof inputSchema)[K]> }
type Properties = NonNullable<Input['properties']>

export function registerCreatePageSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page-simple',
    {
      description:
        'Create a page with Markdown. Title is auto-mapped to the database title property. ' +
        F.markdown_syntax_short,
      inputSchema,
    },
    async ({ data_source_id, title, content, properties, icon }) => {
      try {
        // Try to fetch data source schema to find the title property name
        let titlePropertyName: string = 'Name' // Default fallback
        try {
          const schema = await notion.dataSources.retrieve({ data_source_id })
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
          parent: { data_source_id },
          properties: pageProperties,
          ...(children && { children }),
          ...(icon && { icon: { type: 'emoji' as const, emoji: icon } }),
        })

        // Return minimal response (id + url only)
        return formatSimpleResponse({
          id: response.id,
          url: 'url' in response ? response.url : undefined,
        })
      } catch (error) {
        return handleErrorWithContext(error, notion, {
          dataSourceId: data_source_id,
          exampleType: 'page',
          hint:
            'Hint: The "title" parameter automatically sets the title property. ' +
            'Use "properties" for other fields like select or multi_select.',
        })
      }
    },
  )
}
