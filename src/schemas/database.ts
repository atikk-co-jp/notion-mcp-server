import { z } from 'zod'
import { RichTextArraySchema } from './common.js'

// Title property schema (every database must have exactly one)
export const TitlePropertySchemaSchema = z.object({
  title: z.object({}).optional(),
})

// Rich text property schema
export const RichTextPropertySchemaSchema = z.object({
  rich_text: z.object({}).optional(),
})

// Number property schema
export const NumberPropertySchemaSchema = z.object({
  number: z
    .object({
      format: z
        .enum([
          'number',
          'number_with_commas',
          'percent',
          'dollar',
          'canadian_dollar',
          'euro',
          'pound',
          'yen',
          'ruble',
          'rupee',
          'won',
          'yuan',
          'real',
          'lira',
          'rupiah',
          'franc',
          'hong_kong_dollar',
          'new_zealand_dollar',
          'krona',
          'norwegian_krone',
          'mexican_peso',
          'rand',
          'new_taiwan_dollar',
          'danish_krone',
          'zloty',
          'baht',
          'forint',
          'koruna',
          'shekel',
          'chilean_peso',
          'philippine_peso',
          'dirham',
          'colombian_peso',
          'riyal',
          'ringgit',
          'leu',
          'argentine_peso',
          'uruguayan_peso',
          'singapore_dollar',
        ])
        .optional(),
    })
    .optional(),
})

// Select option schema
export const SelectOptionSchema = z.object({
  name: z.string(),
  color: z
    .enum([
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
    ])
    .optional(),
})

// Select property schema
export const SelectPropertySchemaSchema = z.object({
  select: z
    .object({
      options: z.array(SelectOptionSchema).optional(),
    })
    .optional(),
})

// Multi-select property schema
export const MultiSelectPropertySchemaSchema = z.object({
  multi_select: z
    .object({
      options: z.array(SelectOptionSchema).optional(),
    })
    .optional(),
})

// Status option schema (with groups)
export const StatusOptionSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  color: z
    .enum([
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
    ])
    .optional(),
})

// Status group schema
export const StatusGroupSchema = z.object({
  name: z.string(),
  id: z.string().optional(),
  color: z
    .enum([
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
    ])
    .optional(),
  option_ids: z.array(z.string()).optional(),
})

// Status property schema
// Note: Status options and groups cannot be specified when creating a database.
// Notion automatically creates default options (Not started, In progress, Done).
// Options can only be modified after the database is created.
export const StatusPropertySchemaSchema = z.object({
  status: z.object({}).optional(),
})

// Date property schema
export const DatePropertySchemaSchema = z.object({
  date: z.object({}).optional(),
})

// People property schema
export const PeoplePropertySchemaSchema = z.object({
  people: z.object({}).optional(),
})

// Files property schema
export const FilesPropertySchemaSchema = z.object({
  files: z.object({}).optional(),
})

// Checkbox property schema
export const CheckboxPropertySchemaSchema = z.object({
  checkbox: z.object({}).optional(),
})

// URL property schema
export const UrlPropertySchemaSchema = z.object({
  url: z.object({}).optional(),
})

// Email property schema
export const EmailPropertySchemaSchema = z.object({
  email: z.object({}).optional(),
})

// Phone number property schema
export const PhoneNumberPropertySchemaSchema = z.object({
  phone_number: z.object({}).optional(),
})

// Formula property schema
export const FormulaPropertySchemaSchema = z.object({
  formula: z.object({
    expression: z.string(),
  }),
})

// Relation property schema
export const RelationPropertySchemaSchema = z.object({
  relation: z.object({
    database_id: z.string(),
    type: z.enum(['single_property', 'dual_property']).optional(),
    single_property: z.object({}).optional(),
    dual_property: z
      .object({
        synced_property_name: z.string().optional(),
        synced_property_id: z.string().optional(),
      })
      .optional(),
  }),
})

// Rollup property schema
export const RollupPropertySchemaSchema = z.object({
  rollup: z.object({
    relation_property_name: z.string().optional(),
    relation_property_id: z.string().optional(),
    rollup_property_name: z.string().optional(),
    rollup_property_id: z.string().optional(),
    function: z.enum([
      'count',
      'count_values',
      'empty',
      'not_empty',
      'unique',
      'show_unique',
      'percent_empty',
      'percent_not_empty',
      'sum',
      'average',
      'median',
      'min',
      'max',
      'range',
      'earliest_date',
      'latest_date',
      'date_range',
      'checked',
      'unchecked',
      'percent_checked',
      'percent_unchecked',
      'show_original',
    ]),
  }),
})

// Created time property schema (read-only, auto-generated)
export const CreatedTimePropertySchemaSchema = z.object({
  created_time: z.object({}).optional(),
})

// Created by property schema (read-only, auto-generated)
export const CreatedByPropertySchemaSchema = z.object({
  created_by: z.object({}).optional(),
})

// Last edited time property schema (read-only, auto-generated)
export const LastEditedTimePropertySchemaSchema = z.object({
  last_edited_time: z.object({}).optional(),
})

// Last edited by property schema (read-only, auto-generated)
export const LastEditedByPropertySchemaSchema = z.object({
  last_edited_by: z.object({}).optional(),
})

// Combined database property schema
export const DatabasePropertySchemaSchema = z.union([
  TitlePropertySchemaSchema,
  RichTextPropertySchemaSchema,
  NumberPropertySchemaSchema,
  SelectPropertySchemaSchema,
  MultiSelectPropertySchemaSchema,
  StatusPropertySchemaSchema,
  DatePropertySchemaSchema,
  PeoplePropertySchemaSchema,
  FilesPropertySchemaSchema,
  CheckboxPropertySchemaSchema,
  UrlPropertySchemaSchema,
  EmailPropertySchemaSchema,
  PhoneNumberPropertySchemaSchema,
  FormulaPropertySchemaSchema,
  RelationPropertySchemaSchema,
  RollupPropertySchemaSchema,
  CreatedTimePropertySchemaSchema,
  CreatedByPropertySchemaSchema,
  LastEditedTimePropertySchemaSchema,
  LastEditedByPropertySchemaSchema,
])

// Database properties schema (record of property name to property schema)
export const DatabasePropertiesSchema = z.record(z.string(), DatabasePropertySchemaSchema)

// Database title schema (array of rich text)
export const DatabaseTitleSchema = RichTextArraySchema
