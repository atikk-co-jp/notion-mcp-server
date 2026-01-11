/**
 * InputSchema field descriptions for MCP tools.
 * Key names match inputSchema property names for type safety.
 */

/**
 * Field description.
 * desc can be a string or an object with variants: { default: '...', emoji: '...' }
 */
export interface FieldDesc {
  desc: string | { default: string; [variant: string]: string }
}

/**
 * Field descriptions for all MCP tool input schemas.
 * Key names match the inputSchema property names.
 */
export const Fields = {
  // ============================================
  // ID Fields
  // ============================================
  page_id: {
    desc: {
      default: 'Page ID',
      target: 'Target parent page ID',
    },
  },
  block_id: {
    desc: 'Block or page ID',
  },
  database_id: {
    desc: 'Database ID',
  },
  data_source_id: {
    desc: {
      default: 'Data source ID',
      target: 'Target data source ID',
    },
  },
  parent_page_id: {
    desc: 'Parent page ID',
  },
  user_id: {
    desc: 'User ID',
  },
  property_id: {
    desc: 'Property ID (from page properties)',
  },
  discussion_id: {
    desc: 'Discussion ID (for replies)',
  },

  // ============================================
  // Pagination
  // ============================================
  start_cursor: {
    desc: 'Pagination cursor from previous response',
  },
  page_size: {
    desc: 'Number of results (1-100)',
  },

  // ============================================
  // Format
  // ============================================
  format: {
    desc: "Output format: 'simple' or 'json'",
  },

  // ============================================
  // Properties
  // ============================================
  properties: {
    desc: {
      default: 'Properties object',
      schema: 'Property schema (must include one title property)',
      update: 'Properties to add/update/delete (set to null to delete)',
    },
  },

  // ============================================
  // Content
  // ============================================
  include_content: {
    desc: 'Include page content as markdown (default: true)',
  },
  content: {
    desc: 'Content in Markdown',
  },

  // ============================================
  // Markdown Syntax (for tool descriptions)
  // ============================================
  markdown_syntax: {
    desc: {
      default:
        'Markdown: # headings, - lists, - [ ] checkboxes, ``` code, > quotes, | tables |, ![]() images, **bold**, *italic*, ~~strike~~, `code`, [links](). ' +
        'Extended: <details><summary> toggle, > [!NOTE/WARNING/TIP/IMPORTANT/CAUTION] callout, $$ equation, <u>/++ underline, {color:x}{/color}, {bg:x}{/bg}, ' +
        '[bookmark](), :::columns, @[embed/video/audio/file/pdf]().',
      short:
        '# headings, - lists, - [ ] checkboxes, ``` code, > quotes, | tables |, **bold**, *italic*, [links](), ' +
        '<details> toggle, > [!NOTE] callout, $$ equation.',
    },
  },

  // ============================================
  // Archive / Lock
  // ============================================
  archived: {
    desc: 'Archive status',
  },
  is_locked: {
    desc: 'Lock to prevent UI edits',
  },

  // ============================================
  // Database Schema
  // ============================================
  title: {
    desc: 'Title',
  },
  description: {
    desc: 'Description',
  },
  is_inline: {
    desc: 'Inline database',
  },

  // ============================================
  // Query
  // ============================================
  filter: {
    desc: {
      default: 'Filter object. Example: {"property":"Status","select":{"equals":"Done"}}',
      search:
        'Filter to limit results to pages or data sources. Example: { "value": "page", "property": "object" }',
    },
  },
  sorts: {
    desc: 'Sort array. Example: [{"property":"Date","direction":"descending"}]',
  },
  fields: {
    desc: 'Property names to include in response (simple format only). Example: ["Name", "Status", "Date"]',
  },

  // ============================================
  // Blocks
  // ============================================
  children: {
    desc: 'Block objects array',
  },
  after: {
    desc: 'Insert after this block ID',
  },
  block: {
    desc: 'Block data with type-specific properties',
  },
  fetch_nested: {
    desc: 'Fetch nested children recursively (WARNING: many API calls)',
  },

  // ============================================
  // Icon & Cover
  // ============================================
  icon: {
    desc: {
      default:
        'Icon { type: "emoji", emoji: "📝" } or { type: "external", external: { url: "..." } }',
      emoji: 'Emoji character (e.g. "📝", "🐛", "✅"). Must be an actual emoji, not a name.',
    },
  },
  cover: {
    desc: 'Cover image { type: "external", external: { url: "..." } }',
  },

  // ============================================
  // Rich Text
  // ============================================
  rich_text: {
    desc: 'Rich text array',
  },

  // ============================================
  // Search
  // ============================================
  query: {
    desc: 'Search query text',
  },
  sort: {
    desc: 'Sort order. Example: { "direction": "descending", "timestamp": "last_edited_time" }',
  },

  // ============================================
  // Parent
  // ============================================
  parent: {
    desc: 'Parent (provide either page_id or data_source_id)',
  },
} as const satisfies Record<string, FieldDesc>

/**
 * Shorthand accessor for field descriptions.
 * Usage: z.string().describe(F.page_id)
 *
 * For fields with variants (desc is an object):
 * - F.icon → default description
 * - F.icon_emoji → emoji variant description
 */
export const F = (() => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(Fields)) {
    if (typeof value.desc === 'string') {
      result[key] = value.desc
    } else {
      // desc is an object with variants
      result[key] = value.desc.default
      for (const [variant, desc] of Object.entries(value.desc)) {
        if (variant !== 'default') {
          result[`${key}_${variant}`] = desc
        }
      }
    }
  }
  return result
})() as { [K in keyof typeof Fields]: string } & {
  // Variants
  page_id_target: string
  data_source_id_target: string
  properties_schema: string
  properties_update: string
  filter_search: string
  icon_emoji: string
  markdown_syntax_short: string
}
