import { z } from 'zod'

// Color enum used in annotations and blocks
export const ColorSchema = z.enum([
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
  'yellow_background',
  'green_background',
  'blue_background',
  'purple_background',
  'pink_background',
  'red_background',
])

// Annotations schema
export const AnnotationsSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  underline: z.boolean().optional(),
  code: z.boolean().optional(),
  color: ColorSchema.optional(),
})

// Text type rich text
export const TextRichTextSchema = z.object({
  type: z.literal('text'),
  text: z.object({
    content: z.string(),
    link: z
      .object({
        url: z.string(),
      })
      .nullable()
      .optional(),
  }),
  annotations: AnnotationsSchema.optional(),
  plain_text: z.string().optional(),
  href: z.string().nullable().optional(),
})

// Mention types
export const UserMentionSchema = z.object({
  type: z.literal('user'),
  user: z.object({
    id: z.string(),
    object: z.literal('user').optional(),
  }),
})

export const PageMentionSchema = z.object({
  type: z.literal('page'),
  page: z.object({
    id: z.string(),
  }),
})

export const DatabaseMentionSchema = z.object({
  type: z.literal('database'),
  database: z.object({
    id: z.string(),
  }),
})

export const DateMentionSchema = z.object({
  type: z.literal('date'),
  date: z.object({
    start: z.string(),
    end: z.string().nullable().optional(),
    time_zone: z.string().nullable().optional(),
  }),
})

export const LinkPreviewMentionSchema = z.object({
  type: z.literal('link_preview'),
  link_preview: z.object({
    url: z.string(),
  }),
})

export const TemplateMentionDateSchema = z.object({
  type: z.literal('template_mention_date'),
  template_mention_date: z.enum(['today', 'now']),
})

export const TemplateMentionUserSchema = z.object({
  type: z.literal('template_mention_user'),
  template_mention_user: z.literal('me'),
})

export const TemplateMentionSchema = z.object({
  type: z.literal('template_mention'),
  template_mention: z.union([TemplateMentionDateSchema, TemplateMentionUserSchema]),
})

export const MentionSchema = z.union([
  UserMentionSchema,
  PageMentionSchema,
  DatabaseMentionSchema,
  DateMentionSchema,
  LinkPreviewMentionSchema,
  TemplateMentionSchema,
])

// Mention type rich text
export const MentionRichTextSchema = z.object({
  type: z.literal('mention'),
  mention: MentionSchema,
  annotations: AnnotationsSchema.optional(),
  plain_text: z.string().optional(),
  href: z.string().nullable().optional(),
})

// Equation type rich text
export const EquationRichTextSchema = z.object({
  type: z.literal('equation'),
  equation: z.object({
    expression: z.string(),
  }),
  annotations: AnnotationsSchema.optional(),
  plain_text: z.string().optional(),
  href: z.string().nullable().optional(),
})

// Combined Rich Text schema (supports text, mention, equation)
export const RichTextSchema = z.union([
  TextRichTextSchema,
  MentionRichTextSchema,
  EquationRichTextSchema,
])

export const RichTextArraySchema = z.array(RichTextSchema)

// Helper to create simple text rich text array
export const SimpleTextSchema = z.string().transform((content) => [
  {
    type: 'text' as const,
    text: { content },
  },
])

// Parent schemas
export const DatabaseParentSchema = z.object({
  type: z.literal('database_id').optional(),
  database_id: z.string(),
})

export const PageParentSchema = z.object({
  type: z.literal('page_id').optional(),
  page_id: z.string(),
})

export const ParentSchema = z.union([DatabaseParentSchema, PageParentSchema])

// Icon schemas
export const EmojiIconSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string(),
})

export const ExternalIconSchema = z.object({
  type: z.literal('external'),
  external: z.object({
    url: z.string(),
  }),
})

export const IconSchema = z.union([EmojiIconSchema, ExternalIconSchema])

// Cover schema
export const CoverSchema = z.object({
  type: z.literal('external'),
  external: z.object({
    url: z.string(),
  }),
})
