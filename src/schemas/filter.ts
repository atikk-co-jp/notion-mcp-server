import { z } from 'zod'

// Text filter conditions (for title, rich_text, url, email, phone_number)
const TextFilterConditionSchema = z
  .object({
    equals: z.string().optional(),
    does_not_equal: z.string().optional(),
    contains: z.string().optional(),
    does_not_contain: z.string().optional(),
    starts_with: z.string().optional(),
    ends_with: z.string().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Number filter conditions
const NumberFilterConditionSchema = z
  .object({
    equals: z.number().optional(),
    does_not_equal: z.number().optional(),
    greater_than: z.number().optional(),
    less_than: z.number().optional(),
    greater_than_or_equal_to: z.number().optional(),
    less_than_or_equal_to: z.number().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Checkbox filter conditions
const CheckboxFilterConditionSchema = z
  .object({
    equals: z.boolean().optional(),
    does_not_equal: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Select filter conditions
const SelectFilterConditionSchema = z
  .object({
    equals: z.string().optional(),
    does_not_equal: z.string().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Multi-select filter conditions
const MultiSelectFilterConditionSchema = z
  .object({
    contains: z.string().optional(),
    does_not_contain: z.string().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Status filter conditions
const StatusFilterConditionSchema = z
  .object({
    equals: z.string().optional(),
    does_not_equal: z.string().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Date filter conditions
const DateFilterConditionSchema = z
  .object({
    equals: z.string().optional(),
    before: z.string().optional(),
    after: z.string().optional(),
    on_or_before: z.string().optional(),
    on_or_after: z.string().optional(),
    past_week: z.object({}).optional(),
    past_month: z.object({}).optional(),
    past_year: z.object({}).optional(),
    this_week: z.object({}).optional(),
    next_week: z.object({}).optional(),
    next_month: z.object({}).optional(),
    next_year: z.object({}).optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Relation filter conditions
const RelationFilterConditionSchema = z
  .object({
    contains: z.string().optional(),
    does_not_contain: z.string().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// People filter conditions
const PeopleFilterConditionSchema = z
  .object({
    contains: z.string().optional(),
    does_not_contain: z.string().optional(),
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Files filter conditions
const FilesFilterConditionSchema = z
  .object({
    is_empty: z.literal(true).optional(),
    is_not_empty: z.literal(true).optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Formula filter conditions (nested based on formula result type)
const FormulaFilterConditionSchema = z
  .object({
    checkbox: CheckboxFilterConditionSchema.optional(),
    date: DateFilterConditionSchema.optional(),
    number: NumberFilterConditionSchema.optional(),
    string: TextFilterConditionSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one formula result type must be specified',
  })

// Unique ID filter conditions
const UniqueIdFilterConditionSchema = z
  .object({
    equals: z.number().optional(),
    does_not_equal: z.number().optional(),
    greater_than: z.number().optional(),
    less_than: z.number().optional(),
    greater_than_or_equal_to: z.number().optional(),
    less_than_or_equal_to: z.number().optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one filter condition must be specified',
  })

// Rollup item filter schema (for any/every/none conditions)
// This matches the property filter conditions that can be applied to rollup items
const RollupItemFilterSchema = z.object({
  title: TextFilterConditionSchema.optional(),
  rich_text: TextFilterConditionSchema.optional(),
  url: TextFilterConditionSchema.optional(),
  email: TextFilterConditionSchema.optional(),
  phone_number: TextFilterConditionSchema.optional(),
  number: NumberFilterConditionSchema.optional(),
  checkbox: CheckboxFilterConditionSchema.optional(),
  select: SelectFilterConditionSchema.optional(),
  multi_select: MultiSelectFilterConditionSchema.optional(),
  status: StatusFilterConditionSchema.optional(),
  date: DateFilterConditionSchema.optional(),
  relation: RelationFilterConditionSchema.optional(),
  people: PeopleFilterConditionSchema.optional(),
  files: FilesFilterConditionSchema.optional(),
})

// Rollup filter conditions (depends on rollup aggregation type)
const RollupFilterConditionSchema = z
  .object({
    any: RollupItemFilterSchema.optional(),
    every: RollupItemFilterSchema.optional(),
    none: RollupItemFilterSchema.optional(),
    number: NumberFilterConditionSchema.optional(),
    date: DateFilterConditionSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length === 1, {
    message: 'Exactly one rollup filter condition must be specified',
  })

// Property filter schema
// Note: created_by and last_edited_by properties use the 'people' filter condition
// Example: { property: "created_by", people: { contains: "user-id" } }
export const PropertyFilterSchema = z.object({
  property: z.string(),
  title: TextFilterConditionSchema.optional(),
  rich_text: TextFilterConditionSchema.optional(),
  url: TextFilterConditionSchema.optional(),
  email: TextFilterConditionSchema.optional(),
  phone_number: TextFilterConditionSchema.optional(),
  number: NumberFilterConditionSchema.optional(),
  checkbox: CheckboxFilterConditionSchema.optional(),
  select: SelectFilterConditionSchema.optional(),
  multi_select: MultiSelectFilterConditionSchema.optional(),
  status: StatusFilterConditionSchema.optional(),
  date: DateFilterConditionSchema.optional(),
  relation: RelationFilterConditionSchema.optional(),
  people: PeopleFilterConditionSchema.optional(),
  files: FilesFilterConditionSchema.optional(),
  formula: FormulaFilterConditionSchema.optional(),
  unique_id: UniqueIdFilterConditionSchema.optional(),
  rollup: RollupFilterConditionSchema.optional(),
})

// Timestamp filter schema
export const TimestampFilterSchema = z.object({
  timestamp: z.enum(['created_time', 'last_edited_time']),
  created_time: DateFilterConditionSchema.optional(),
  last_edited_time: DateFilterConditionSchema.optional(),
})

// Compound filter type (recursive)
export type FilterType =
  | z.infer<typeof PropertyFilterSchema>
  | z.infer<typeof TimestampFilterSchema>
  | { and: FilterType[] }
  | { or: FilterType[] }

// Compound filter schema (uses lazy for recursion)
export const FilterSchema: z.ZodType<FilterType> = z.lazy(() =>
  z.union([
    PropertyFilterSchema,
    TimestampFilterSchema,
    z.object({ and: z.array(FilterSchema) }),
    z.object({ or: z.array(FilterSchema) }),
  ]),
)

// Sort schema
export const SortSchema = z.object({
  property: z.string().optional(),
  timestamp: z.enum(['created_time', 'last_edited_time']).optional(),
  direction: z.enum(['ascending', 'descending']),
})

export const SortsSchema = z.array(SortSchema)
