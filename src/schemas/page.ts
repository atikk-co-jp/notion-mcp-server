import { z } from 'zod'
import { RichTextArraySchema } from './common.js'

// User object schema (used in people, created_by, last_edited_by)
export const UserObjectSchema = z.object({
  id: z.string(),
  object: z.literal('user').optional(),
  type: z.enum(['person', 'bot']).optional(),
  name: z.string().optional(),
  avatar_url: z.string().nullable(),
})

// Title property value
export const TitlePropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('title').optional(),
  title: RichTextArraySchema,
})

// Rich text property value
export const RichTextPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('rich_text').optional(),
  rich_text: RichTextArraySchema,
})

// Number property value
export const NumberPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('number').optional(),
  number: z.number().nullable(),
})

// Select property value
export const SelectPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('select').optional(),
  select: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
    })
    .nullable(),
})

// Multi-select property value
export const MultiSelectPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('multi_select').optional(),
  multi_select: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
    }),
  ),
})

// Status property value
export const StatusPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('status').optional(),
  status: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
    })
    .nullable(),
})

// Date property value
export const DatePropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('date').optional(),
  date: z
    .object({
      start: z.string(),
      end: z.string().nullable().optional(),
      time_zone: z.string().nullable().optional(),
    })
    .nullable(),
})

// Checkbox property value
export const CheckboxPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('checkbox').optional(),
  checkbox: z.boolean(),
})

// URL property value
export const UrlPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('url').optional(),
  url: z.string().nullable(),
})

// Email property value
export const EmailPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('email').optional(),
  email: z.string().nullable(),
})

// Phone number property value
export const PhoneNumberPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('phone_number').optional(),
  phone_number: z.string().nullable(),
})

// Relation property value
export const RelationPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('relation').optional(),
  relation: z.array(
    z.object({
      id: z.string(),
    }),
  ),
  has_more: z.boolean().optional(),
})

// People property value
export const PeoplePropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('people').optional(),
  people: z.array(UserObjectSchema),
})

// Files property value
export const FilesPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('files').optional(),
  files: z.array(
    z.union([
      z.object({
        type: z.literal('external'),
        name: z.string(),
        external: z.object({
          url: z.string(),
        }),
      }),
      z.object({
        type: z.literal('file'),
        name: z.string(),
        file: z.object({
          url: z.string(),
          expiry_time: z.string().optional(),
        }),
      }),
    ]),
  ),
})

// Created time property value (read-only)
export const CreatedTimePropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('created_time').optional(),
  created_time: z.string(),
})

// Created by property value (read-only)
export const CreatedByPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('created_by').optional(),
  created_by: UserObjectSchema,
})

// Last edited time property value (read-only)
export const LastEditedTimePropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('last_edited_time').optional(),
  last_edited_time: z.string(),
})

// Last edited by property value (read-only)
export const LastEditedByPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('last_edited_by').optional(),
  last_edited_by: UserObjectSchema,
})

// Formula property value (read-only)
export const FormulaPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('formula').optional(),
  formula: z.union([
    z.object({
      type: z.literal('string'),
      string: z.string().nullable(),
    }),
    z.object({
      type: z.literal('number'),
      number: z.number().nullable(),
    }),
    z.object({
      type: z.literal('boolean'),
      boolean: z.boolean().nullable(),
    }),
    z.object({
      type: z.literal('date'),
      date: z
        .object({
          start: z.string(),
          end: z.string().nullable().optional(),
          time_zone: z.string().nullable().optional(),
        })
        .nullable(),
    }),
  ]),
})

// Rollup array item schema (simplified property value for rollup results)
const RollupArrayItemSchema = z.union([
  // Title
  z.object({ type: z.literal('title'), title: RichTextArraySchema }),
  // Rich text
  z.object({ type: z.literal('rich_text'), rich_text: RichTextArraySchema }),
  // Number
  z.object({ type: z.literal('number'), number: z.number().nullable() }),
  // Select
  z.object({
    type: z.literal('select'),
    select: z.object({ name: z.string(), color: z.string().optional() }).nullable(),
  }),
  // Multi-select
  z.object({
    type: z.literal('multi_select'),
    multi_select: z.array(z.object({ name: z.string(), color: z.string().optional() })),
  }),
  // Status
  z.object({
    type: z.literal('status'),
    status: z.object({ name: z.string(), color: z.string().optional() }).nullable(),
  }),
  // Date
  z.object({
    type: z.literal('date'),
    date: z
      .object({
        start: z.string(),
        end: z.string().nullable().optional(),
        time_zone: z.string().nullable().optional(),
      })
      .nullable(),
  }),
  // Checkbox
  z.object({ type: z.literal('checkbox'), checkbox: z.boolean() }),
  // URL
  z.object({ type: z.literal('url'), url: z.string().nullable() }),
  // Email
  z.object({ type: z.literal('email'), email: z.string().nullable() }),
  // Phone number
  z.object({ type: z.literal('phone_number'), phone_number: z.string().nullable() }),
  // People
  z.object({ type: z.literal('people'), people: z.array(UserObjectSchema) }),
  // Relation
  z.object({ type: z.literal('relation'), relation: z.array(z.object({ id: z.string() })) }),
])

// Rollup property value (read-only)
export const RollupPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('rollup').optional(),
  rollup: z.union([
    z.object({
      type: z.literal('number'),
      number: z.number().nullable(),
      function: z.string(),
    }),
    z.object({
      type: z.literal('date'),
      date: z
        .object({
          start: z.string(),
          end: z.string().nullable().optional(),
          time_zone: z.string().nullable().optional(),
        })
        .nullable(),
      function: z.string(),
    }),
    z.object({
      type: z.literal('array'),
      array: z.array(RollupArrayItemSchema),
      function: z.string(),
    }),
    z.object({
      type: z.literal('unsupported'),
      unsupported: z.object({}),
      function: z.string(),
    }),
    z.object({
      type: z.literal('incomplete'),
      incomplete: z.object({}),
      function: z.string(),
    }),
  ]),
})

// Unique ID property value (read-only)
export const UniqueIdPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('unique_id').optional(),
  unique_id: z.object({
    number: z.number(),
    prefix: z.string().nullable().optional(),
  }),
})

// Verification property value
export const VerificationPropertySchema = z.object({
  id: z.string().optional(),
  type: z.literal('verification').optional(),
  verification: z
    .object({
      state: z.enum(['verified', 'unverified']),
      verified_by: UserObjectSchema.nullable().optional(),
      date: z
        .object({
          start: z.string(),
          end: z.string().nullable().optional(),
          time_zone: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable(),
})

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
  CreatedTimePropertySchema,
  CreatedByPropertySchema,
  LastEditedTimePropertySchema,
  LastEditedByPropertySchema,
  FormulaPropertySchema,
  RollupPropertySchema,
  UniqueIdPropertySchema,
  VerificationPropertySchema,
])

// Properties object schema (record of property name to property value)
export const PropertiesSchema = z.record(z.string(), PropertyValueSchema)
