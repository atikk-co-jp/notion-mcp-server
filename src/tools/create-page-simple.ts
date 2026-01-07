import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import type { Block } from '../schemas/block.js'
import type { PropertyValueSchema } from '../schemas/page.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

interface DataSourceProperty {
  type: string
  [key: string]: unknown
}

interface DataSourceResponse {
  properties: Record<string, DataSourceProperty>
}

type PropertyValue = z.infer<typeof PropertyValueSchema>

// Minimal schema for MCP
const inputSchema = {
  data_source_id: z.string().describe('Data source ID (required in API 2025-09-03)'),
  title: z.string().describe('Page title'),
  content: z.string().optional().describe('Page content in Markdown'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties'),
  icon: z
    .string()
    .optional()
    .describe('Emoji character (e.g. "📝", "🐛", "✅"). Must be an actual emoji, not a name.'),
}

export function registerCreatePageSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page-simple',
    {
      description:
        'Create a page with Markdown. Title is auto-mapped to the database title property. ' +
        'Supports: # headings, - lists, - [ ] checkboxes, ``` code, > quotes, | tables |, **bold**, *italic*, [links]().',
      inputSchema,
    },
    async ({ data_source_id, title, content, properties, icon }) => {
      try {
        // Try to fetch data source schema to find the title property name
        let titlePropertyName: string = 'Name' // Default fallback
        try {
          const schema = await notion.dataSources.retrieve<DataSourceResponse>({
            data_source_id,
          })
          // Find the title property name from schema
          const foundTitleProp = Object.entries(schema.properties).find(
            ([, prop]) => prop.type === 'title',
          )
          if (foundTitleProp) {
            titlePropertyName = foundTitleProp[0]
          }
        } catch {
          // If schema fetch fails, fall back to 'Name'
        }

        // Build properties with title
        const pageProperties: Record<string, PropertyValue> = {
          ...(properties as Record<string, PropertyValue>),
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

        const response = await notion.pages.create({
          parent: { data_source_id },
          properties: pageProperties,
          ...(content && { children: markdownToBlocks(content) as Block[] }),
          ...(icon && { icon: { type: 'emoji' as const, emoji: icon } }),
        })
        return formatResponse(response)
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
