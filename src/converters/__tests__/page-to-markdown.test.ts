import { describe, expect, it } from 'vitest'
import {
  type NotionProperty,
  pagePropertiesToObject,
  pagePropertiesToSimple,
  pagesToSimple,
  pageToSimple,
} from '../page-to-markdown.js'

describe('pagePropertiesToObject', () => {
  describe('text properties', () => {
    it('converts title property', () => {
      const properties: Record<string, NotionProperty> = {
        Name: {
          type: 'title',
          title: [{ type: 'text', text: { content: 'My Page' }, plain_text: 'My Page' }],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Name: 'My Page',
      })
    })

    it('converts rich_text property', () => {
      const properties: Record<string, NotionProperty> = {
        Description: {
          type: 'rich_text',
          rich_text: [
            { type: 'text', text: { content: 'Some description' }, plain_text: 'Some description' },
          ],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Description: 'Some description',
      })
    })

    it('handles empty rich_text', () => {
      const properties: Record<string, NotionProperty> = {
        Description: {
          type: 'rich_text',
          rich_text: [],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Description: '',
      })
    })
  })

  describe('number property', () => {
    it('converts number property', () => {
      const properties: Record<string, NotionProperty> = {
        Count: {
          type: 'number',
          number: 42,
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Count: 42,
      })
    })

    it('handles null number', () => {
      const properties: Record<string, NotionProperty> = {
        Count: {
          type: 'number',
          number: null,
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Count: null,
      })
    })
  })

  describe('select properties', () => {
    it('converts select property', () => {
      const properties: Record<string, NotionProperty> = {
        Status: {
          type: 'select',
          select: { id: '123', name: 'Done', color: 'green' },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Status: 'Done',
      })
    })

    it('handles null select', () => {
      const properties: Record<string, NotionProperty> = {
        Status: {
          type: 'select',
          select: null,
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Status: null,
      })
    })

    it('converts multi_select property', () => {
      const properties: Record<string, NotionProperty> = {
        Tags: {
          type: 'multi_select',
          multi_select: [
            { id: '1', name: 'Bug', color: 'red' },
            { id: '2', name: 'Feature', color: 'green' },
          ],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Tags: ['Bug', 'Feature'],
      })
    })

    it('handles empty multi_select', () => {
      const properties: Record<string, NotionProperty> = {
        Tags: {
          type: 'multi_select',
          multi_select: [],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Tags: [],
      })
    })

    it('converts status property', () => {
      const properties: Record<string, NotionProperty> = {
        Progress: {
          type: 'status',
          status: { id: '123', name: 'In Progress', color: 'blue' },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Progress: 'In Progress',
      })
    })
  })

  describe('date property', () => {
    it('converts date property with start only', () => {
      const properties: Record<string, NotionProperty> = {
        DueDate: {
          type: 'date',
          date: { start: '2024-01-15' },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        DueDate: '2024-01-15',
      })
    })

    it('converts date property with start and end', () => {
      const properties: Record<string, NotionProperty> = {
        Period: {
          type: 'date',
          date: { start: '2024-01-01', end: '2024-01-31' },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Period: '2024-01-01 → 2024-01-31',
      })
    })

    it('handles null date', () => {
      const properties: Record<string, NotionProperty> = {
        DueDate: {
          type: 'date',
          date: null,
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        DueDate: null,
      })
    })
  })

  describe('checkbox property', () => {
    it('converts checkbox true', () => {
      const properties: Record<string, NotionProperty> = {
        Completed: {
          type: 'checkbox',
          checkbox: true,
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Completed: true,
      })
    })

    it('converts checkbox false', () => {
      const properties: Record<string, NotionProperty> = {
        Completed: {
          type: 'checkbox',
          checkbox: false,
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Completed: false,
      })
    })
  })

  describe('url/email/phone properties', () => {
    it('converts url property', () => {
      const properties: Record<string, NotionProperty> = {
        Website: {
          type: 'url',
          url: 'https://example.com',
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Website: 'https://example.com',
      })
    })

    it('converts email property', () => {
      const properties: Record<string, NotionProperty> = {
        Email: {
          type: 'email',
          email: 'test@example.com',
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Email: 'test@example.com',
      })
    })

    it('converts phone_number property', () => {
      const properties: Record<string, NotionProperty> = {
        Phone: {
          type: 'phone_number',
          phone_number: '+1-234-567-8900',
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Phone: '+1-234-567-8900',
      })
    })
  })

  describe('relation property', () => {
    it('converts relation property', () => {
      const properties: Record<string, NotionProperty> = {
        Related: {
          type: 'relation',
          relation: [{ id: 'page-1' }, { id: 'page-2' }],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Related: ['page-1', 'page-2'],
      })
    })

    it('handles empty relation', () => {
      const properties: Record<string, NotionProperty> = {
        Related: {
          type: 'relation',
          relation: [],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Related: [],
      })
    })
  })

  describe('people property', () => {
    it('converts people property with names', () => {
      const properties: Record<string, NotionProperty> = {
        Assignees: {
          type: 'people',
          people: [
            { id: 'user-1', name: 'John' },
            { id: 'user-2', name: 'Jane' },
          ],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Assignees: ['John', 'Jane'],
      })
    })

    it('converts people property without names (uses id)', () => {
      const properties: Record<string, NotionProperty> = {
        Assignees: {
          type: 'people',
          people: [{ id: 'user-1' }, { id: 'user-2' }],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Assignees: ['user-1', 'user-2'],
      })
    })
  })

  describe('files property', () => {
    it('converts files property with names', () => {
      const properties: Record<string, NotionProperty> = {
        Attachments: {
          type: 'files',
          files: [
            { name: 'doc.pdf', external: { url: 'https://example.com/doc.pdf' } },
            { name: 'image.png', file: { url: 'https://s3.amazonaws.com/image.png' } },
          ],
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Attachments: ['doc.pdf', 'image.png'],
      })
    })
  })

  describe('time properties', () => {
    it('converts created_time property', () => {
      const properties: Record<string, NotionProperty> = {
        Created: {
          type: 'created_time',
          created_time: '2024-01-15T10:00:00.000Z',
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Created: '2024-01-15T10:00:00.000Z',
      })
    })

    it('converts last_edited_time property', () => {
      const properties: Record<string, NotionProperty> = {
        Updated: {
          type: 'last_edited_time',
          last_edited_time: '2024-01-15T10:00:00.000Z',
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Updated: '2024-01-15T10:00:00.000Z',
      })
    })
  })

  describe('formula property', () => {
    it('converts formula string result', () => {
      const properties: Record<string, NotionProperty> = {
        Formula: {
          type: 'formula',
          formula: { type: 'string', string: 'result' },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Formula: 'result',
      })
    })

    it('converts formula number result', () => {
      const properties: Record<string, NotionProperty> = {
        Formula: {
          type: 'formula',
          formula: { type: 'number', number: 100 },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Formula: 100,
      })
    })

    it('converts formula boolean result', () => {
      const properties: Record<string, NotionProperty> = {
        Formula: {
          type: 'formula',
          formula: { type: 'boolean', boolean: true },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        Formula: true,
      })
    })
  })

  describe('unique_id property', () => {
    it('converts unique_id with prefix', () => {
      const properties: Record<string, NotionProperty> = {
        ID: {
          type: 'unique_id',
          unique_id: { prefix: 'TASK', number: 123 },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        ID: 'TASK-123',
      })
    })

    it('converts unique_id without prefix', () => {
      const properties: Record<string, NotionProperty> = {
        ID: {
          type: 'unique_id',
          unique_id: { number: 456 },
        },
      }
      expect(pagePropertiesToObject(properties)).toEqual({
        ID: '456',
      })
    })
  })

  describe('handles undefined/null properties', () => {
    it('handles undefined properties', () => {
      expect(
        pagePropertiesToObject(undefined as unknown as Record<string, NotionProperty>),
      ).toEqual({})
    })

    it('handles null properties', () => {
      expect(pagePropertiesToObject(null as unknown as Record<string, NotionProperty>)).toEqual({})
    })
  })
})

describe('pagePropertiesToSimple', () => {
  it('returns array with name, type, and value', () => {
    const properties: Record<string, NotionProperty> = {
      Name: {
        type: 'title',
        title: [{ type: 'text', text: { content: 'Test' }, plain_text: 'Test' }],
      },
      Status: {
        type: 'select',
        select: { id: '1', name: 'Done', color: 'green' },
      },
    }

    const result = pagePropertiesToSimple(properties)

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({ name: 'Name', type: 'title', value: 'Test' })
    expect(result).toContainEqual({ name: 'Status', type: 'select', value: 'Done' })
  })
})

describe('pageToSimple', () => {
  it('converts page object to simple format', () => {
    const page = {
      id: 'page-123',
      url: 'https://notion.so/page-123',
      properties: {
        Name: {
          type: 'title',
          title: [{ type: 'text', text: { content: 'My Page' }, plain_text: 'My Page' }],
        },
        Status: {
          type: 'select',
          select: { id: '1', name: 'Active', color: 'green' },
        },
      },
    }

    const result = pageToSimple(page)

    expect(result).toEqual({
      id: 'page-123',
      url: 'https://notion.so/page-123',
      properties: {
        Name: 'My Page',
        Status: 'Active',
      },
    })
  })

  it('handles missing url', () => {
    const page = {
      id: 'page-123',
      properties: {
        Name: {
          type: 'title',
          title: [{ type: 'text', text: { content: 'Test' }, plain_text: 'Test' }],
        },
      },
    }

    const result = pageToSimple(page)

    expect(result.url).toBe('')
  })
})

describe('pagesToSimple', () => {
  it('converts array of pages to simple format', () => {
    const pages = [
      {
        id: 'page-1',
        url: 'https://notion.so/page-1',
        properties: {
          Name: {
            type: 'title',
            title: [{ type: 'text', text: { content: 'Page 1' }, plain_text: 'Page 1' }],
          },
        },
      },
      {
        id: 'page-2',
        url: 'https://notion.so/page-2',
        properties: {
          Name: {
            type: 'title',
            title: [{ type: 'text', text: { content: 'Page 2' }, plain_text: 'Page 2' }],
          },
        },
      },
    ]

    const result = pagesToSimple(pages)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'page-1',
      url: 'https://notion.so/page-1',
      properties: { Name: 'Page 1' },
    })
    expect(result[1]).toEqual({
      id: 'page-2',
      url: 'https://notion.so/page-2',
      properties: { Name: 'Page 2' },
    })
  })

  it('handles empty array', () => {
    expect(pagesToSimple([])).toEqual([])
  })

  it('handles undefined input', () => {
    expect(
      pagesToSimple(
        undefined as unknown as {
          id: string
          url?: string
          properties: Record<string, NotionProperty>
        }[],
      ),
    ).toEqual([])
  })
})

describe('real world data', () => {
  it('converts actual Notion page properties', () => {
    // 実際のNotionから取得したデータ形式
    const properties: Record<string, NotionProperty> = {
      依存チケット: {
        id: '%3AF_%7C',
        type: 'relation',
        relation: [{ id: '2dea79a9-39bc-81ee-9871-da4f2ffc8ae8' }],
      },
      担当者: {
        id: '%3Bgic',
        type: 'people',
        people: [],
      },
      対象パッケージ: {
        id: '%3ByBh',
        type: 'multi_select',
        multi_select: [
          { id: '5b008554-068a-47df-9220-a619b5767128', name: 'slide-video-core', color: 'yellow' },
          { id: 'd1f58db1-9651-4632-83c7-fb92c451837b', name: 'その他', color: 'gray' },
        ],
      },
      優先度: {
        id: 'FwQz',
        type: 'select',
        select: { id: '368514f6-b7ca-4a02-999f-c281b921a14a', name: 'Low', color: 'blue' },
      },
      ステータス: {
        id: 'Vegg',
        type: 'select',
        select: { id: 'f601cd45-cfe3-43fd-b7ba-59d46b9cc564', name: '完了', color: 'green' },
      },
      説明: {
        id: 'dTNj',
        type: 'rich_text',
        rich_text: [
          {
            type: 'text',
            text: { content: 'Monorepoルール違反。', link: null },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: 'Monorepoルール違反。',
            href: null,
          },
        ],
      },
      期限: {
        id: 'iBLk',
        type: 'date',
        date: null,
      },
      起票日時: {
        id: '%7DmV%3A',
        type: 'created_time',
        created_time: '2026-01-04T21:55:00.000Z',
      },
      名前: {
        id: 'title',
        type: 'title',
        title: [
          {
            type: 'text',
            text: { content: '冗長な main/types フィールドを削除', link: null },
            plain_text: '冗長な main/types フィールドを削除',
          },
        ],
      },
    }

    const result = pagePropertiesToObject(properties)

    expect(result).toEqual({
      依存チケット: ['2dea79a9-39bc-81ee-9871-da4f2ffc8ae8'],
      担当者: [],
      対象パッケージ: ['slide-video-core', 'その他'],
      優先度: 'Low',
      ステータス: '完了',
      説明: 'Monorepoルール違反。',
      期限: null,
      起票日時: '2026-01-04T21:55:00.000Z',
      名前: '冗長な main/types フィールドを削除',
    })
  })
})
