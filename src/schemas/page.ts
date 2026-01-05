import { z } from "zod";
import { RichTextArraySchema } from "./common.js";

// Title property value
export const TitlePropertySchema = z.object({
  type: z.literal("title").optional(),
  title: RichTextArraySchema,
});

// Rich text property value
export const RichTextPropertySchema = z.object({
  type: z.literal("rich_text").optional(),
  rich_text: RichTextArraySchema,
});

// Number property value
export const NumberPropertySchema = z.object({
  type: z.literal("number").optional(),
  number: z.number().nullable(),
});

// Select property value
export const SelectPropertySchema = z.object({
  type: z.literal("select").optional(),
  select: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
    })
    .nullable(),
});

// Multi-select property value
export const MultiSelectPropertySchema = z.object({
  type: z.literal("multi_select").optional(),
  multi_select: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
    }),
  ),
});

// Status property value
export const StatusPropertySchema = z.object({
  type: z.literal("status").optional(),
  status: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
    })
    .nullable(),
});

// Date property value
export const DatePropertySchema = z.object({
  type: z.literal("date").optional(),
  date: z
    .object({
      start: z.string(),
      end: z.string().nullable().optional(),
      time_zone: z.string().nullable().optional(),
    })
    .nullable(),
});

// Checkbox property value
export const CheckboxPropertySchema = z.object({
  type: z.literal("checkbox").optional(),
  checkbox: z.boolean(),
});

// URL property value
export const UrlPropertySchema = z.object({
  type: z.literal("url").optional(),
  url: z.string().nullable(),
});

// Email property value
export const EmailPropertySchema = z.object({
  type: z.literal("email").optional(),
  email: z.string().nullable(),
});

// Phone number property value
export const PhoneNumberPropertySchema = z.object({
  type: z.literal("phone_number").optional(),
  phone_number: z.string().nullable(),
});

// Relation property value
export const RelationPropertySchema = z.object({
  type: z.literal("relation").optional(),
  relation: z.array(
    z.object({
      id: z.string(),
    }),
  ),
});

// People property value
export const PeoplePropertySchema = z.object({
  type: z.literal("people").optional(),
  people: z.array(
    z.object({
      id: z.string(),
      object: z.literal("user").optional(),
    }),
  ),
});

// Files property value
export const FilesPropertySchema = z.object({
  type: z.literal("files").optional(),
  files: z.array(
    z.union([
      z.object({
        type: z.literal("external"),
        name: z.string(),
        external: z.object({
          url: z.string(),
        }),
      }),
      z.object({
        type: z.literal("file"),
        name: z.string(),
        file: z.object({
          url: z.string(),
          expiry_time: z.string().optional(),
        }),
      }),
    ]),
  ),
});

// Combined property value schema (flexible for any property type)
export const PropertyValueSchema = z.union([
  TitlePropertySchema,
  RichTextPropertySchema,
  NumberPropertySchema,
  SelectPropertySchema,
  MultiSelectPropertySchema,
  StatusPropertySchema,
  DatePropertySchema,
  CheckboxPropertySchema,
  UrlPropertySchema,
  EmailPropertySchema,
  PhoneNumberPropertySchema,
  RelationPropertySchema,
  PeoplePropertySchema,
  FilesPropertySchema,
]);

// Properties object schema (record of property name to property value)
export const PropertiesSchema = z.record(z.string(), PropertyValueSchema);
