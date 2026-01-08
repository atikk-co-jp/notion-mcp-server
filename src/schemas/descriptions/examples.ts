/**
 * Property format examples for error messages.
 * Minimal JSON format for token efficiency.
 * Co-located with schemas to prevent drift.
 */

// Page property value examples (for create-page, update-page)
export const PagePropertyExamples: Record<string, string> = {
  title: '{"title":[{"text":{"content":"value"}}]}',
  rich_text: '{"rich_text":[{"text":{"content":"value"}}]}',
  number: '{"number":123}',
  select: '{"select":{"name":"Option"}}',
  multi_select: '{"multi_select":[{"name":"Option"}]}',
  status: '{"status":{"name":"Status"}}',
  date: '{"date":{"start":"2024-01-01"}}',
  checkbox: '{"checkbox":true}',
  url: '{"url":"https://example.com"}',
  email: '{"email":"a@example.com"}',
  phone_number: '{"phone_number":"+1-234-567-8900"}',
  relation: '{"relation":[{"id":"page-id"}]}',
  people: '{"people":[{"id":"user-id"}]}',
  files: '{"files":[{"type":"external","name":"file","external":{"url":"https://..."}}]}',
}

// Schema property examples (for create-database, update-data-source)
export const SchemaPropertyExamples: Record<string, string> = {
  title: '{"title":{}}',
  rich_text: '{"rich_text":{}}',
  number: '{"number":{"format":"number"}}',
  select: '{"select":{"options":[{"name":"Option"}]}}',
  multi_select: '{"multi_select":{"options":[{"name":"Option"}]}}',
  status: '{"status":{}}',
  date: '{"date":{}}',
  checkbox: '{"checkbox":{}}',
  url: '{"url":{}}',
  email: '{"email":{}}',
  phone_number: '{"phone_number":{}}',
  relation: '{"relation":{"database_id":"db-id"}}',
  people: '{"people":{}}',
  files: '{"files":{}}',
  formula: '{"formula":{"expression":"prop(\\"Name\\")"}}',
}

// Block examples (for append-block-children, update-block)
export const BlockExamples: Record<string, string> = {
  paragraph: '{"paragraph":{"rich_text":[{"text":{"content":"Text"}}]}}',
  heading_1: '{"heading_1":{"rich_text":[{"text":{"content":"Heading"}}]}}',
  heading_2: '{"heading_2":{"rich_text":[{"text":{"content":"Heading"}}]}}',
  heading_3: '{"heading_3":{"rich_text":[{"text":{"content":"Heading"}}]}}',
  bulleted_list_item: '{"bulleted_list_item":{"rich_text":[{"text":{"content":"Item"}}]}}',
  numbered_list_item: '{"numbered_list_item":{"rich_text":[{"text":{"content":"Item"}}]}}',
  to_do: '{"to_do":{"rich_text":[{"text":{"content":"Task"}}],"checked":false}}',
  code: '{"code":{"rich_text":[{"text":{"content":"code"}}],"language":"javascript"}}',
  quote: '{"quote":{"rich_text":[{"text":{"content":"Quote"}}]}}',
  divider: '{"divider":{}}',
}

// RichText array example (for create-comment, update-database title/description)
export const RichTextArrayExample = '[{"text":{"content":"Text"}}]'

// Filter examples (for query-data-source, search)
export const FilterExamples: Record<string, string> = {
  select: '{"property":"Status","select":{"equals":"Done"}}',
  text: '{"property":"Name","rich_text":{"contains":"keyword"}}',
  checkbox: '{"property":"Done","checkbox":{"equals":true}}',
  date: '{"property":"Date","date":{"on_or_after":"2024-01-01"}}',
  and: '{"and":[{"property":"Status","select":{"equals":"Done"}},{"property":"Date","date":{"on_or_after":"2024-01-01"}}]}',
  or: '{"or":[{"property":"Status","select":{"equals":"Done"}},{"property":"Status","select":{"equals":"In Progress"}}]}',
}

// Sort examples (for query-data-source)
export const SortExamples = '[{"property":"Date","direction":"descending"}]'

// Example type for handleErrorWithContext
export type ExampleType = 'page' | 'schema' | 'block' | 'richTextArray' | 'filter'

// Get examples by type
export function getExamplesByType(type: ExampleType): string {
  switch (type) {
    case 'page':
      return formatExamples('Page property format', PagePropertyExamples)
    case 'schema':
      return formatExamples('Schema property format', SchemaPropertyExamples)
    case 'block':
      return formatExamples('Block format', BlockExamples)
    case 'richTextArray':
      return `RichText array format:\n  ${RichTextArrayExample}`
    case 'filter':
      return `${formatExamples('Filter format', FilterExamples)}\n\nSort format:\n  ${SortExamples}`
  }
}

function formatExamples(title: string, examples: Record<string, string>): string {
  const lines = Object.entries(examples)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n')
  return `${title} examples:\n${lines}`
}
