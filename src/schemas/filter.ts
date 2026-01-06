import { z } from 'zod'

// Text filter conditions
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
const CheckboxFilterConditionSchema = z.object({
  equals: z.boolean(),
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

// Property filter schema
export const PropertyFilterSchema = z.object({
  property: z.string(),
  title: TextFilterConditionSchema.optional(),
  rich_text: TextFilterConditionSchema.optional(),
  number: NumberFilterConditionSchema.optional(),
  checkbox: CheckboxFilterConditionSchema.optional(),
  select: SelectFilterConditionSchema.optional(),
  multi_select: MultiSelectFilterConditionSchema.optional(),
  status: StatusFilterConditionSchema.optional(),
  date: DateFilterConditionSchema.optional(),
  relation: RelationFilterConditionSchema.optional(),
})

// Compound filter type (recursive)
export type FilterType =
  | z.infer<typeof PropertyFilterSchema>
  | { and: FilterType[] }
  | { or: FilterType[] }

// Compound filter schema (uses lazy for recursion)
export const FilterSchema: z.ZodType<FilterType> = z.lazy(() =>
  z.union([
    PropertyFilterSchema,
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
