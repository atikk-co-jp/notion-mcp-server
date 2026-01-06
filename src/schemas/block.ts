import { z } from 'zod'
import { RichTextArraySchema, ColorSchema } from './common.js'

// Base Block interface for recursive type definition
export interface Block {
  object?: 'block'
  id?: string
  type: string
  created_time?: string
  last_edited_time?: string
  created_by?: { object: 'user'; id: string }
  last_edited_by?: { object: 'user'; id: string }
  has_children?: boolean
  archived?: boolean
  in_trash?: boolean
  parent?: {
    type: 'database_id' | 'page_id' | 'block_id' | 'workspace'
    database_id?: string
    page_id?: string
    block_id?: string
    workspace?: boolean
  }
  [key: string]: unknown
}

// File object schemas (used by image, video, audio, file, pdf blocks)
export const ExternalFileSchema = z.object({
  type: z.literal('external'),
  external: z.object({
    url: z.string(),
  }),
})

export const NotionFileSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    url: z.string(),
    expiry_time: z.string().optional(),
  }),
})

export const FileUploadSchema = z.object({
  type: z.literal('file_upload'),
  file_upload: z.object({
    id: z.string(),
    expiry_time: z.string().optional(),
  }),
})

export const FileObjectSchema = z.union([ExternalFileSchema, NotionFileSchema, FileUploadSchema])

// Icon schemas for callout
export const EmojiIconBlockSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
})

export const FileIconBlockSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    url: z.string(),
    expiry_time: z.string().optional(),
  }),
})

export const ExternalIconBlockSchema = z.object({
  type: z.literal('external'),
  external: z.object({
    url: z.string(),
  }),
})

export const IconBlockSchema = z.union([
  EmojiIconBlockSchema,
  FileIconBlockSchema,
  ExternalIconBlockSchema,
])

// Paragraph block
export const ParagraphBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('paragraph'),
  paragraph: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Heading 1 block
export const Heading1BlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('heading_1'),
  heading_1: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    is_toggleable: z.boolean().optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Heading 2 block
export const Heading2BlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('heading_2'),
  heading_2: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    is_toggleable: z.boolean().optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Heading 3 block
export const Heading3BlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('heading_3'),
  heading_3: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    is_toggleable: z.boolean().optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Bulleted list item block
export const BulletedListItemBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('bulleted_list_item'),
  bulleted_list_item: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Numbered list item block
export const NumberedListItemBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('numbered_list_item'),
  numbered_list_item: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// To-do block
export const ToDoBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('to_do'),
  to_do: z.object({
    rich_text: RichTextArraySchema,
    checked: z.boolean().optional(),
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Toggle block
export const ToggleBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('toggle'),
  toggle: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Code block
export const CodeBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('code'),
  code: z.object({
    rich_text: RichTextArraySchema,
    language: z.string(),
    caption: RichTextArraySchema.optional(),
  }),
})

// Quote block
export const QuoteBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('quote'),
  quote: z.object({
    rich_text: RichTextArraySchema,
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Callout block
export const CalloutBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('callout'),
  callout: z.object({
    rich_text: RichTextArraySchema,
    icon: IconBlockSchema.optional(),
    color: ColorSchema.optional(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Divider block
export const DividerBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('divider'),
  divider: z.object({}).optional(),
})

// Bookmark block
export const BookmarkBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('bookmark'),
  bookmark: z.object({
    url: z.string(),
    caption: RichTextArraySchema.optional(),
  }),
})

// Image block (supports external, file, file_upload)
export const ImageBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('image'),
  image: z
    .object({
      caption: RichTextArraySchema.optional(),
    })
    .and(FileObjectSchema),
})

// Video block (supports external, file, file_upload)
export const VideoBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('video'),
  video: z
    .object({
      caption: RichTextArraySchema.optional(),
    })
    .and(FileObjectSchema),
})

// Audio block
export const AudioBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('audio'),
  audio: FileObjectSchema,
})

// File block
export const FileBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('file'),
  file: z
    .object({
      caption: RichTextArraySchema.optional(),
      name: z.string().optional(),
    })
    .and(FileObjectSchema),
})

// PDF block
export const PdfBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('pdf'),
  pdf: z
    .object({
      caption: RichTextArraySchema.optional(),
    })
    .and(FileObjectSchema),
})

// Embed block
export const EmbedBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('embed'),
  embed: z.object({
    url: z.string(),
    caption: RichTextArraySchema.optional(),
  }),
})

// Equation block
export const EquationBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('equation'),
  equation: z.object({
    expression: z.string(),
  }),
})

// Table of contents block
export const TableOfContentsBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('table_of_contents'),
  table_of_contents: z.object({
    color: ColorSchema.optional(),
  }),
})

// Breadcrumb block
export const BreadcrumbBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('breadcrumb'),
  breadcrumb: z.object({}),
})

// Column list block
export const ColumnListBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('column_list'),
  column_list: z.object({
    children: z.array(z.lazy(() => ColumnBlockSchema)).optional(),
  }),
})

// Column block
export const ColumnBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('column'),
  column: z.object({
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Child page block
export const ChildPageBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('child_page'),
  child_page: z.object({
    title: z.string(),
  }),
})

// Child database block
export const ChildDatabaseBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('child_database'),
  child_database: z.object({
    title: z.string(),
  }),
})

// Link preview block (read-only)
export const LinkPreviewBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('link_preview'),
  link_preview: z.object({
    url: z.string(),
  }),
})

// Link to page block
export const LinkToPageBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('link_to_page'),
  link_to_page: z.union([
    z.object({
      type: z.literal('page_id'),
      page_id: z.string(),
    }),
    z.object({
      type: z.literal('database_id'),
      database_id: z.string(),
    }),
  ]),
})

// Synced block (original)
export const SyncedBlockOriginalSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('synced_block'),
  synced_block: z.object({
    synced_from: z.null(),
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Synced block (duplicate/reference)
export const SyncedBlockDuplicateSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('synced_block'),
  synced_block: z.object({
    synced_from: z.object({
      type: z.literal('block_id').optional(),
      block_id: z.string(),
    }),
  }),
})

export const SyncedBlockSchema = z.union([SyncedBlockOriginalSchema, SyncedBlockDuplicateSchema])

// Table block
export const TableBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('table'),
  table: z.object({
    table_width: z.number().int(),
    has_column_header: z.boolean().optional(),
    has_row_header: z.boolean().optional(),
    children: z.array(z.lazy(() => TableRowBlockSchema)).optional(),
  }),
})

// Table row block
export const TableRowBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('table_row'),
  table_row: z.object({
    cells: z.array(RichTextArraySchema),
  }),
})

// Template block (deprecated)
export const TemplateBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('template'),
  template: z.object({
    rich_text: RichTextArraySchema,
    children: z.array(z.lazy(() => BlockSchema)).optional(),
  }),
})

// Unsupported block (for read-only blocks)
export const UnsupportedBlockSchema = z.object({
  object: z.literal('block').optional(),
  type: z.literal('unsupported'),
  unsupported: z.object({}).optional(),
})

// Combined block schema with proper type annotation for recursive structure
export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
  z.union([
    ParagraphBlockSchema,
    Heading1BlockSchema,
    Heading2BlockSchema,
    Heading3BlockSchema,
    BulletedListItemBlockSchema,
    NumberedListItemBlockSchema,
    ToDoBlockSchema,
    ToggleBlockSchema,
    CodeBlockSchema,
    QuoteBlockSchema,
    CalloutBlockSchema,
    DividerBlockSchema,
    BookmarkBlockSchema,
    ImageBlockSchema,
    VideoBlockSchema,
    AudioBlockSchema,
    FileBlockSchema,
    PdfBlockSchema,
    EmbedBlockSchema,
    EquationBlockSchema,
    TableOfContentsBlockSchema,
    BreadcrumbBlockSchema,
    ColumnListBlockSchema,
    ColumnBlockSchema,
    ChildPageBlockSchema,
    ChildDatabaseBlockSchema,
    LinkPreviewBlockSchema,
    LinkToPageBlockSchema,
    SyncedBlockSchema,
    TableBlockSchema,
    TableRowBlockSchema,
    TemplateBlockSchema,
    UnsupportedBlockSchema,
  ]),
)

export const BlockChildrenSchema = z.array(BlockSchema)
