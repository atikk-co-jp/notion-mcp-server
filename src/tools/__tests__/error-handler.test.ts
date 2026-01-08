import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const toolsDir = resolve(import.meta.dirname, '..')

/**
 * Test that all tools use the correct error handler with proper options.
 *
 * handleErrorWithContext is used for tools that need contextual error messages
 * with examples for validation errors:
 * - page: for page property operations (create-page, update-page, etc.)
 * - schema: for database schema operations (create-database, update-data-source)
 * - block: for block operations (append-block-children, update-block)
 * - richTextArray: for rich text operations (create-comment, update-database)
 * - filter: for filter operations (query-data-source, search)
 *
 * handleError is used for simple operations where contextual help is not needed.
 */

interface ToolErrorConfig {
  toolFile: string
  handler: 'handleErrorWithContext' | 'handleError'
  exampleType?: 'page' | 'schema' | 'block' | 'richTextArray' | 'filter'
  hasDataSourceId?: boolean
}

const toolErrorConfigs: ToolErrorConfig[] = [
  // Tools using handleErrorWithContext
  { toolFile: 'append-block-children.ts', handler: 'handleErrorWithContext', exampleType: 'block' },
  { toolFile: 'create-comment.ts', handler: 'handleErrorWithContext', exampleType: 'richTextArray' },
  { toolFile: 'create-database.ts', handler: 'handleErrorWithContext', exampleType: 'schema' },
  {
    toolFile: 'create-page.ts',
    handler: 'handleErrorWithContext',
    exampleType: 'page',
    hasDataSourceId: true,
  },
  {
    toolFile: 'create-page-simple.ts',
    handler: 'handleErrorWithContext',
    exampleType: 'page',
    hasDataSourceId: true,
  },
  { toolFile: 'query-data-source.ts', handler: 'handleErrorWithContext', exampleType: 'filter' },
  { toolFile: 'search.ts', handler: 'handleErrorWithContext', exampleType: 'filter' },
  { toolFile: 'update-block.ts', handler: 'handleErrorWithContext', exampleType: 'block' },
  {
    toolFile: 'update-data-source.ts',
    handler: 'handleErrorWithContext',
    exampleType: 'schema',
    hasDataSourceId: true,
  },
  {
    toolFile: 'update-database.ts',
    handler: 'handleErrorWithContext',
    exampleType: 'richTextArray',
  },
  { toolFile: 'update-page.ts', handler: 'handleErrorWithContext', exampleType: 'page' },

  // Tools using handleError (no contextual help needed)
  { toolFile: 'append-blocks-simple.ts', handler: 'handleError' },
  { toolFile: 'archive-database.ts', handler: 'handleError' },
  { toolFile: 'archive-page.ts', handler: 'handleError' },
  { toolFile: 'create-comment-simple.ts', handler: 'handleError' },
  { toolFile: 'delete-block.ts', handler: 'handleError' },
  { toolFile: 'get-block-children.ts', handler: 'handleError' },
  { toolFile: 'list-comments.ts', handler: 'handleError' },
  { toolFile: 'list-users.ts', handler: 'handleError' },
  { toolFile: 'move-page.ts', handler: 'handleError' },
  { toolFile: 'retrieve-block.ts', handler: 'handleError' },
  { toolFile: 'retrieve-bot-user.ts', handler: 'handleError' },
  { toolFile: 'retrieve-data-source.ts', handler: 'handleError' },
  { toolFile: 'retrieve-database.ts', handler: 'handleError' },
  { toolFile: 'retrieve-page.ts', handler: 'handleError' },
  { toolFile: 'retrieve-page-property.ts', handler: 'handleError' },
  { toolFile: 'retrieve-user.ts', handler: 'handleError' },
  { toolFile: 'update-block-simple.ts', handler: 'handleError' },
]

describe('Tool error handlers', () => {
  describe.each(toolErrorConfigs)(
    '$toolFile',
    ({ toolFile, handler, exampleType, hasDataSourceId }) => {
      const filePath = resolve(toolsDir, toolFile)
      const content = readFileSync(filePath, 'utf-8')

      it(`should import ${handler}`, () => {
        const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${handler}\\b[^}]*\\}`)
        expect(content).toMatch(importRegex)
      })

      it(`should call ${handler} in catch block`, () => {
        const callRegex = new RegExp(`return\\s+${handler}\\(error`)
        expect(content).toMatch(callRegex)
      })

      if (handler === 'handleErrorWithContext') {
        it(`should use exampleType: '${exampleType}'`, () => {
          const exampleTypeRegex = new RegExp(`exampleType:\\s*['"]${exampleType}['"]`)
          expect(content).toMatch(exampleTypeRegex)
        })

        if (hasDataSourceId) {
          it('should pass dataSourceId option', () => {
            expect(content).toMatch(/dataSourceId:\s*\w+/)
          })
        }
      }

      if (handler === 'handleError') {
        it('should not use handleErrorWithContext', () => {
          expect(content).not.toMatch(/handleErrorWithContext/)
        })
      }
    },
  )
})

describe('All tool files are covered', () => {
  it('should have a config for each tool file (excluding index.ts)', () => {
    const expectedToolFiles = [
      'append-block-children.ts',
      'append-blocks-simple.ts',
      'archive-database.ts',
      'archive-page.ts',
      'create-comment.ts',
      'create-comment-simple.ts',
      'create-database.ts',
      'create-page.ts',
      'create-page-simple.ts',
      'delete-block.ts',
      'get-block-children.ts',
      'list-comments.ts',
      'list-users.ts',
      'move-page.ts',
      'query-data-source.ts',
      'retrieve-block.ts',
      'retrieve-bot-user.ts',
      'retrieve-data-source.ts',
      'retrieve-database.ts',
      'retrieve-page.ts',
      'retrieve-page-property.ts',
      'retrieve-user.ts',
      'search.ts',
      'update-block.ts',
      'update-block-simple.ts',
      'update-data-source.ts',
      'update-database.ts',
      'update-page.ts',
    ]

    const configuredFiles = toolErrorConfigs.map((c) => c.toolFile).sort()
    expect(configuredFiles).toEqual(expectedToolFiles.sort())
  })
})
