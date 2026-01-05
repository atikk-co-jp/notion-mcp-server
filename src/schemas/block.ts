import { z } from "zod";
import { RichTextArraySchema } from "./common.js";

// Paragraph block
export const ParagraphBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("paragraph"),
  paragraph: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
  }),
});

// Heading 1 block
export const Heading1BlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("heading_1"),
  heading_1: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
    is_toggleable: z.boolean().optional(),
  }),
});

// Heading 2 block
export const Heading2BlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("heading_2"),
  heading_2: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
    is_toggleable: z.boolean().optional(),
  }),
});

// Heading 3 block
export const Heading3BlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("heading_3"),
  heading_3: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
    is_toggleable: z.boolean().optional(),
  }),
});

// Bulleted list item block
export const BulletedListItemBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("bulleted_list_item"),
  bulleted_list_item: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
  }),
});

// Numbered list item block
export const NumberedListItemBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("numbered_list_item"),
  numbered_list_item: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
  }),
});

// To-do block
export const ToDoBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("to_do"),
  to_do: z.object({
    rich_text: RichTextArraySchema,
    checked: z.boolean().optional(),
    color: z.string().optional(),
  }),
});

// Toggle block
export const ToggleBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("toggle"),
  toggle: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
  }),
});

// Code block
export const CodeBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("code"),
  code: z.object({
    rich_text: RichTextArraySchema,
    language: z.string(),
    caption: RichTextArraySchema.optional(),
  }),
});

// Quote block
export const QuoteBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("quote"),
  quote: z.object({
    rich_text: RichTextArraySchema,
    color: z.string().optional(),
  }),
});

// Callout block
export const CalloutBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("callout"),
  callout: z.object({
    rich_text: RichTextArraySchema,
    icon: z
      .union([
        z.object({
          type: z.literal("emoji"),
          emoji: z.string(),
        }),
        z.object({
          type: z.literal("external"),
          external: z.object({ url: z.string() }),
        }),
      ])
      .optional(),
    color: z.string().optional(),
  }),
});

// Divider block
export const DividerBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("divider"),
  divider: z.object({}).optional(),
});

// Bookmark block
export const BookmarkBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("bookmark"),
  bookmark: z.object({
    url: z.string(),
    caption: RichTextArraySchema.optional(),
  }),
});

// Image block
export const ImageBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("image"),
  image: z.object({
    type: z.literal("external"),
    external: z.object({
      url: z.string(),
    }),
    caption: RichTextArraySchema.optional(),
  }),
});

// Video block
export const VideoBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("video"),
  video: z.object({
    type: z.literal("external"),
    external: z.object({
      url: z.string(),
    }),
    caption: RichTextArraySchema.optional(),
  }),
});

// Embed block
export const EmbedBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("embed"),
  embed: z.object({
    url: z.string(),
    caption: RichTextArraySchema.optional(),
  }),
});

// Table of contents block
export const TableOfContentsBlockSchema = z.object({
  object: z.literal("block").optional(),
  type: z.literal("table_of_contents"),
  table_of_contents: z.object({
    color: z.string().optional(),
  }),
});

// Combined block schema
export const BlockSchema = z.union([
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
  EmbedBlockSchema,
  TableOfContentsBlockSchema,
]);

export const BlockChildrenSchema = z.array(BlockSchema);
