import { describe, expect, it } from 'vitest'
import {
  BlockSchema,
  Heading1BlockSchema,
  ImageBlockSchema,
  ParagraphBlockSchema,
  SyncedBlockSchema,
  TableBlockSchema,
} from './block.js'
import { ColorSchema, IconSchema, RichTextSchema } from './common.js'
import { DatabasePropertiesSchema, StatusPropertySchemaSchema } from './database.js'
import { FilterSchema, PropertyFilterSchema, SortSchema, TimestampFilterSchema } from './filter.js'
import {
  PropertyValueSchema,
  RollupPropertySchema,
  StatusPropertySchema,
  TitlePropertySchema,
} from './page.js'

describe('Common Schemas', () => {
  describe('RichTextSchema', () => {
    it('should validate text rich text', () => {
      const textRichText = {
        type: 'text',
        text: { content: 'Hello', link: null },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'Hello',
      }
      expect(RichTextSchema.safeParse(textRichText).success).toBe(true)
    })

    it('should validate mention rich text', () => {
      const mentionRichText = {
        type: 'mention',
        mention: {
          type: 'user',
          user: { id: 'user-id', object: 'user' },
        },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: '@User',
      }
      expect(RichTextSchema.safeParse(mentionRichText).success).toBe(true)
    })

    it('should validate equation rich text', () => {
      const equationRichText = {
        type: 'equation',
        equation: { expression: 'E = mc^2' },
        annotations: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default',
        },
        plain_text: 'E = mc^2',
      }
      expect(RichTextSchema.safeParse(equationRichText).success).toBe(true)
    })
  })

  describe('IconSchema', () => {
    it('should validate emoji icon', () => {
      const emojiIcon = { type: 'emoji', emoji: '🚀' }
      expect(IconSchema.safeParse(emojiIcon).success).toBe(true)
    })

    it('should validate external icon', () => {
      const externalIcon = {
        type: 'external',
        external: { url: 'https://example.com/icon.png' },
      }
      expect(IconSchema.safeParse(externalIcon).success).toBe(true)
    })
  })

  describe('ColorSchema', () => {
    it('should validate valid colors', () => {
      const validColors = [
        'default',
        'gray',
        'brown',
        'orange',
        'yellow',
        'green',
        'blue',
        'purple',
        'pink',
        'red',
        'gray_background',
        'brown_background',
        'orange_background',
      ]
      for (const color of validColors) {
        expect(ColorSchema.safeParse(color).success).toBe(true)
      }
    })

    it('should reject invalid colors', () => {
      expect(ColorSchema.safeParse('invalid_color').success).toBe(false)
    })
  })
})

describe('Block Schemas', () => {
  describe('ParagraphBlockSchema', () => {
    it('should validate paragraph block', () => {
      const paragraph = {
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: 'Hello' } }],
        },
      }
      expect(ParagraphBlockSchema.safeParse(paragraph).success).toBe(true)
    })

    it('should validate paragraph with color', () => {
      const paragraph = {
        type: 'paragraph',
        paragraph: {
          rich_text: [],
          color: 'blue',
        },
      }
      expect(ParagraphBlockSchema.safeParse(paragraph).success).toBe(true)
    })
  })

  describe('Heading1BlockSchema', () => {
    it('should validate heading block with toggleable', () => {
      const heading = {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: 'Title' } }],
          is_toggleable: true,
        },
      }
      expect(Heading1BlockSchema.safeParse(heading).success).toBe(true)
    })
  })

  describe('ImageBlockSchema', () => {
    it('should validate external image', () => {
      const image = {
        type: 'image',
        image: {
          type: 'external',
          external: { url: 'https://example.com/image.png' },
        },
      }
      expect(ImageBlockSchema.safeParse(image).success).toBe(true)
    })

    it('should validate file image', () => {
      const image = {
        type: 'image',
        image: {
          type: 'file',
          file: {
            url: 'https://s3.example.com/image.png',
            expiry_time: '2024-01-01T00:00:00.000Z',
          },
          caption: [],
        },
      }
      expect(ImageBlockSchema.safeParse(image).success).toBe(true)
    })
  })

  describe('TableBlockSchema', () => {
    it('should validate table block', () => {
      const table = {
        type: 'table',
        table: {
          table_width: 3,
          has_column_header: true,
          has_row_header: false,
        },
      }
      expect(TableBlockSchema.safeParse(table).success).toBe(true)
    })
  })

  describe('SyncedBlockSchema', () => {
    it('should validate original synced block', () => {
      const syncedBlock = {
        type: 'synced_block',
        synced_block: {
          synced_from: null,
        },
      }
      expect(SyncedBlockSchema.safeParse(syncedBlock).success).toBe(true)
    })

    it('should validate duplicate synced block', () => {
      const syncedBlock = {
        type: 'synced_block',
        synced_block: {
          synced_from: {
            block_id: 'block-id-123',
          },
        },
      }
      expect(SyncedBlockSchema.safeParse(syncedBlock).success).toBe(true)
    })
  })

  describe('BlockSchema (union)', () => {
    it('should validate various block types', () => {
      const blocks = [
        { type: 'paragraph', paragraph: { rich_text: [] } },
        { type: 'heading_1', heading_1: { rich_text: [] } },
        { type: 'divider', divider: {} },
        { type: 'breadcrumb', breadcrumb: {} },
      ]
      for (const block of blocks) {
        expect(BlockSchema.safeParse(block).success).toBe(true)
      }
    })
  })
})

describe('Filter Schemas', () => {
  describe('PropertyFilterSchema', () => {
    it('should validate text filter', () => {
      const filter = {
        property: 'Name',
        title: { contains: 'test' },
      }
      expect(PropertyFilterSchema.safeParse(filter).success).toBe(true)
    })

    it('should validate number filter', () => {
      const filter = {
        property: 'Price',
        number: { greater_than: 100 },
      }
      expect(PropertyFilterSchema.safeParse(filter).success).toBe(true)
    })

    it('should validate checkbox filter', () => {
      const filter = {
        property: 'Done',
        checkbox: { equals: true },
      }
      expect(PropertyFilterSchema.safeParse(filter).success).toBe(true)
    })

    it('should validate date filter with this_week', () => {
      const filter = {
        property: 'Due Date',
        date: { this_week: {} },
      }
      expect(PropertyFilterSchema.safeParse(filter).success).toBe(true)
    })

    it('should validate rollup filter', () => {
      const filter = {
        property: 'Tasks',
        rollup: {
          any: {
            status: { equals: 'Done' },
          },
        },
      }
      expect(PropertyFilterSchema.safeParse(filter).success).toBe(true)
    })
  })

  describe('TimestampFilterSchema', () => {
    it('should validate created_time filter', () => {
      const filter = {
        timestamp: 'created_time',
        created_time: { after: '2024-01-01' },
      }
      expect(TimestampFilterSchema.safeParse(filter).success).toBe(true)
    })
  })

  describe('FilterSchema (compound)', () => {
    it('should validate AND compound filter', () => {
      const filter = {
        and: [
          { property: 'Name', title: { contains: 'test' } },
          { property: 'Done', checkbox: { equals: true } },
        ],
      }
      expect(FilterSchema.safeParse(filter).success).toBe(true)
    })

    it('should validate OR compound filter', () => {
      const filter = {
        or: [
          { property: 'Status', status: { equals: 'Active' } },
          { property: 'Status', status: { equals: 'Pending' } },
        ],
      }
      expect(FilterSchema.safeParse(filter).success).toBe(true)
    })

    it('should validate nested compound filter', () => {
      const filter = {
        and: [
          {
            or: [
              { property: 'Type', select: { equals: 'A' } },
              { property: 'Type', select: { equals: 'B' } },
            ],
          },
          { property: 'Active', checkbox: { equals: true } },
        ],
      }
      expect(FilterSchema.safeParse(filter).success).toBe(true)
    })
  })

  describe('SortSchema', () => {
    it('should validate property sort', () => {
      const sort = {
        property: 'Name',
        direction: 'ascending',
      }
      expect(SortSchema.safeParse(sort).success).toBe(true)
    })

    it('should validate timestamp sort', () => {
      const sort = {
        timestamp: 'created_time',
        direction: 'descending',
      }
      expect(SortSchema.safeParse(sort).success).toBe(true)
    })
  })
})

describe('Page Property Schemas', () => {
  describe('TitlePropertySchema', () => {
    it('should validate title property', () => {
      const title = {
        type: 'title',
        title: [{ type: 'text', text: { content: 'My Page' } }],
      }
      expect(TitlePropertySchema.safeParse(title).success).toBe(true)
    })
  })

  describe('StatusPropertySchema', () => {
    it('should validate status property', () => {
      const status = {
        type: 'status',
        status: {
          name: 'In Progress',
          color: 'blue',
        },
      }
      expect(StatusPropertySchema.safeParse(status).success).toBe(true)
    })

    it('should validate null status', () => {
      const status = {
        type: 'status',
        status: null,
      }
      expect(StatusPropertySchema.safeParse(status).success).toBe(true)
    })
  })

  describe('RollupPropertySchema', () => {
    it('should validate number rollup', () => {
      const rollup = {
        type: 'rollup',
        rollup: {
          type: 'number',
          number: 42,
          function: 'sum',
        },
      }
      expect(RollupPropertySchema.safeParse(rollup).success).toBe(true)
    })

    it('should validate array rollup', () => {
      const rollup = {
        type: 'rollup',
        rollup: {
          type: 'array',
          array: [
            { type: 'title', title: [{ type: 'text', text: { content: 'Item 1' } }] },
            { type: 'title', title: [{ type: 'text', text: { content: 'Item 2' } }] },
          ],
          function: 'show_original',
        },
      }
      expect(RollupPropertySchema.safeParse(rollup).success).toBe(true)
    })
  })

  describe('PropertyValueSchema (union)', () => {
    it('should validate various property types', () => {
      const properties = [
        { type: 'title', title: [] },
        { type: 'rich_text', rich_text: [] },
        { type: 'number', number: 123 },
        { type: 'checkbox', checkbox: true },
        { type: 'url', url: 'https://example.com' },
      ]
      for (const prop of properties) {
        expect(PropertyValueSchema.safeParse(prop).success).toBe(true)
      }
    })
  })
})

describe('Database Schemas', () => {
  describe('StatusPropertySchemaSchema', () => {
    it('should validate status property schema', () => {
      // Note: Status options cannot be specified at creation time
      // Notion creates default options automatically
      const statusSchema = { status: {} }
      expect(StatusPropertySchemaSchema.safeParse(statusSchema).success).toBe(true)
    })
  })

  describe('DatabasePropertiesSchema', () => {
    it('should validate database properties', () => {
      const properties = {
        Name: { title: {} },
        Description: { rich_text: {} },
        Price: { number: { format: 'dollar' } },
        Status: { status: {} }, // Status options created automatically by Notion
        Tags: {
          multi_select: {
            options: [
              { name: 'Tag1', color: 'blue' },
              { name: 'Tag2', color: 'red' },
            ],
          },
        },
        Priority: {
          select: {
            options: [
              { name: 'High', color: 'red' },
              { name: 'Low', color: 'green' },
            ],
          },
        },
      }
      expect(DatabasePropertiesSchema.safeParse(properties).success).toBe(true)
    })
  })
})
