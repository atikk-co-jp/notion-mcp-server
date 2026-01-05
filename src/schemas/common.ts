import { z } from "zod";

// Rich Text object schema
export const RichTextSchema = z.object({
  type: z.literal("text").default("text"),
  text: z.object({
    content: z.string(),
    link: z
      .object({
        url: z.string(),
      })
      .nullable()
      .optional(),
  }),
  annotations: z
    .object({
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      strikethrough: z.boolean().optional(),
      underline: z.boolean().optional(),
      code: z.boolean().optional(),
      color: z
        .enum([
          "default",
          "gray",
          "brown",
          "orange",
          "yellow",
          "green",
          "blue",
          "purple",
          "pink",
          "red",
          "gray_background",
          "brown_background",
          "orange_background",
          "yellow_background",
          "green_background",
          "blue_background",
          "purple_background",
          "pink_background",
          "red_background",
        ])
        .optional(),
    })
    .optional(),
  plain_text: z.string().optional(),
  href: z.string().nullable().optional(),
});

export const RichTextArraySchema = z.array(RichTextSchema);

// Helper to create simple text rich text array
export const SimpleTextSchema = z.string().transform((content) => [
  {
    type: "text" as const,
    text: { content },
  },
]);

// Parent schemas
export const DatabaseParentSchema = z.object({
  type: z.literal("database_id").optional(),
  database_id: z.string(),
});

export const PageParentSchema = z.object({
  type: z.literal("page_id").optional(),
  page_id: z.string(),
});

export const ParentSchema = z.union([DatabaseParentSchema, PageParentSchema]);

// Icon schemas
export const EmojiIconSchema = z.object({
  type: z.literal("emoji"),
  emoji: z.string(),
});

export const ExternalIconSchema = z.object({
  type: z.literal("external"),
  external: z.object({
    url: z.string(),
  }),
});

export const IconSchema = z.union([EmojiIconSchema, ExternalIconSchema]);

// Cover schema
export const CoverSchema = z.object({
  type: z.literal("external"),
  external: z.object({
    url: z.string(),
  }),
});
