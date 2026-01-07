import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { markdownToBlocks } from '../converters/index.js'
import type { NotionClient } from '../notion-client.js'
import { formatResponse, handleErrorWithContext } from '../utils/index.js'

interface DataSourceProperty {
  type: string
  [key: string]: unknown
}

interface DataSourceResponse {
  properties: Record<string, DataSourceProperty>
}

// Minimal schema for MCP
const inputSchema = {
  data_source_id: z.string().describe('Data source ID (required in API 2025-09-03)'),
  title: z.string().describe('Page title'),
  content: z.string().optional().describe('Page content in Markdown'),
  properties: z.record(z.string(), z.any()).optional().describe('Additional properties'),
  icon: z.string().optional().describe('Emoji character (e.g. "📝", "🐛", "✅"). Must be an actual emoji, not a name.'),
}

export function registerCreatePageSimple(server: McpServer, notion: NotionClient): void {
  server.registerTool(
    'create-page-simple',
    {
      description:
        'Create a Notion page with Markdown content. ' +
        'Simpler than create-page: just provide title and markdown text. ' +
        'Supports: headings (#), lists (- or 1.), checkboxes (- [ ]), code blocks (```), quotes (>), images (![]()), bold (**), italic (*), links ([]()), etc. ' +
        '(API version 2025-09-03)',
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
        const pageProperties: Record<string, unknown> = {
          ...properties,
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

        // Build params
        const params: {
          parent: { data_source_id: string }
          properties: Record<string, unknown>
          children?: unknown[]
          icon?: { type: 'emoji'; emoji: string }
        } = {
          parent: { data_source_id },
          properties: pageProperties,
        }

        // Convert markdown to blocks if content provided
        if (content) {
          params.children = markdownToBlocks(content)
        }

        // Add icon if provided
        if (icon) {
          params.icon = { type: 'emoji', emoji: icon }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await notion.pages.create(params as any)
        return formatResponse(response)
      } catch (error) {
        return handleErrorWithContext(error, notion, data_source_id, {
          hint:
            'Hint: The "title" parameter automatically sets the title property. ' +
            'Use "properties" for other fields like select or multi_select.',
        })
      }
    },
  )
}
