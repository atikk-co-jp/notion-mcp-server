import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { describe, expect, it } from 'vitest'
import { toJSONSchema } from 'zod/v4/core'
import { NotionClient } from '../../notion-client.js'
import { registerAllTools } from '../index.js'

/**
 * Test that all tools don't consume excessive context when registered with MCP.
 *
 * Context is consumed by:
 * 1. Tool description - the description string passed to registerTool
 * 2. Input schema - converted to JSON Schema via toJSONSchema (Zod v4)
 *
 * These tests measure the actual JSON Schema that MCP sends to LLMs.
 * Token counts are approximated as chars/4 (rough estimate for JSON).
 */

// Thresholds in estimated tokens (chars / 4)
// Based on actual MCP tool registration token counts from user data
const SINGLE_TOOL_MAX_TOKENS = 1500 // Max tokens for a single tool
const TOTAL_TOOLS_MAX_TOKENS = 30000 // Max total tokens for all tools combined
const TOTAL_TOOLS_WARNING_TOKENS = 35000 // Warning threshold

// Known large tools that need optimization (tracked for future improvement)
// NOTE: query-data-source, update-database, create-database were optimized using
// z.any() with FieldDescriptions, reducing ~13,500 tokens. All tools now fit within
// the standard SINGLE_TOOL_MAX_TOKENS threshold.
const KNOWN_LARGE_TOOLS: Record<
  string,
  { reason: string; actualTokens: number; maxAllowed: number }
> = {
  // Currently empty - all tools have been optimized
}

interface RegisteredTool {
  description?: string
  inputSchema?: unknown
  title?: string
  annotations?: unknown
}

interface JsonSchema {
  type?: string
  properties?: Record<string, unknown>
  [key: string]: unknown
}

// Access internal registered tools from McpServer
function getRegisteredTools(server: McpServer): Record<string, RegisteredTool> {
  // biome-ignore lint/suspicious/noExplicitAny: Internal API access required for testing
  return (server as any)._registeredTools as Record<string, RegisteredTool>
}

// Create a mock notion client for testing (won't make actual API calls)
function createMockNotionClient(): NotionClient {
  return new NotionClient({ auth: 'test-token' })
}

// Convert Zod schema to JSON Schema (same as MCP does internally)
function zodToJsonSchema(zodSchema: unknown): JsonSchema {
  try {
    // Use Zod v4's toJSONSchema - same as MCP SDK uses
    return toJSONSchema(zodSchema as Parameters<typeof toJSONSchema>[0]) as JsonSchema
  } catch {
    // Fallback for non-Zod schemas
    return {}
  }
}

// Calculate the context size for a single tool (in estimated tokens)
function calculateToolContextSize(tool: RegisteredTool): {
  descriptionChars: number
  schemaChars: number
  totalChars: number
  estimatedTokens: number
} {
  const descriptionChars = tool.description?.length ?? 0

  // Convert to JSON Schema (same as MCP does)
  const jsonSchema = tool.inputSchema ? zodToJsonSchema(tool.inputSchema) : {}
  const schemaChars = JSON.stringify(jsonSchema).length

  const totalChars = descriptionChars + schemaChars
  // Rough token estimate: ~4 chars per token for JSON
  const estimatedTokens = Math.ceil(totalChars / 4)

  return {
    descriptionChars,
    schemaChars,
    totalChars,
    estimatedTokens,
  }
}

describe('Tool context size', () => {
  const server = new McpServer({ name: 'test-server', version: '1.0.0' })
  const notion = createMockNotionClient()

  // Register all tools
  registerAllTools(server, notion)

  const registeredTools = getRegisteredTools(server)
  const toolNames = Object.keys(registeredTools)

  describe('Individual tool sizes', () => {
    it.each(toolNames)('%s should not exceed token limit', (toolName) => {
      const tool = registeredTools[toolName]
      const { estimatedTokens, descriptionChars, schemaChars } = calculateToolContextSize(tool)

      // Check if this is a known large tool with special limits
      const knownLargeTool = KNOWN_LARGE_TOOLS[toolName]
      const maxAllowed = knownLargeTool?.maxAllowed ?? SINGLE_TOOL_MAX_TOKENS

      // Log sizes for debugging (visible in verbose mode)
      console.log(
        `${toolName}: ~${estimatedTokens} tokens (desc=${descriptionChars}, schema=${schemaChars} chars)` +
          (knownLargeTool ? ` [KNOWN LARGE: ${knownLargeTool.reason}]` : ''),
      )

      expect(estimatedTokens).toBeLessThanOrEqual(maxAllowed)
    })
  })

  describe('Total context size', () => {
    it('should report total context size and check limits', () => {
      let totalTokens = 0
      let totalTokensExcludingKnownLarge = 0
      const toolSizes: Array<{ name: string; tokens: number; isKnownLarge: boolean }> = []

      for (const [name, tool] of Object.entries(registeredTools)) {
        const { estimatedTokens } = calculateToolContextSize(tool)
        const isKnownLarge = name in KNOWN_LARGE_TOOLS
        totalTokens += estimatedTokens
        if (!isKnownLarge) {
          totalTokensExcludingKnownLarge += estimatedTokens
        }
        toolSizes.push({ name, tokens: estimatedTokens, isKnownLarge })
      }

      // Sort by size descending for the report
      toolSizes.sort((a, b) => b.tokens - a.tokens)

      console.log('\n=== Tool Context Size Report (Estimated Tokens) ===')
      console.log(`Total tools: ${toolNames.length}`)
      console.log(`Total estimated tokens: ~${totalTokens}`)
      console.log(`Total (excluding known large): ~${totalTokensExcludingKnownLarge}`)
      console.log(`Target limit: ${TOTAL_TOOLS_MAX_TOKENS} tokens`)
      console.log(`Warning limit: ${TOTAL_TOOLS_WARNING_TOKENS} tokens`)
      console.log(
        `Usage (excluding known large): ${((totalTokensExcludingKnownLarge / TOTAL_TOOLS_MAX_TOKENS) * 100).toFixed(1)}%`,
      )
      console.log('\nTop 10 largest tools:')
      toolSizes.slice(0, 10).forEach(({ name, tokens, isKnownLarge }, i) => {
        const marker = isKnownLarge ? ' [KNOWN LARGE]' : ''
        console.log(`  ${i + 1}. ${name}: ~${tokens} tokens${marker}`)
      })

      // Check that tools excluding known large ones are within target
      expect(totalTokensExcludingKnownLarge).toBeLessThanOrEqual(TOTAL_TOOLS_MAX_TOKENS)

      // Warn if total exceeds warning threshold (test still passes but logs warning)
      if (totalTokens > TOTAL_TOOLS_WARNING_TOKENS) {
        console.warn(
          `\n⚠️  WARNING: Total tokens (~${totalTokens}) exceeds warning threshold (${TOTAL_TOOLS_WARNING_TOKENS})`,
        )
        console.warn(
          '   Consider optimizing known large tools by replacing complex schemas with z.any()',
        )
      }
    })
  })

  describe('Schema complexity checks', () => {
    it.each(toolNames)('%s should use z.any() for complex nested structures', (toolName) => {
      const tool = registeredTools[toolName]
      if (!tool.inputSchema) return

      const schemaStr = JSON.stringify(tool.inputSchema)

      // Check that complex properties don't have deeply nested definitions
      // If they did, the schema would contain many "properties" keys
      const propertiesCount = (schemaStr.match(/"properties":/g) || []).length

      // Allow max 2 levels of nesting (root + one level of additionalProperties)
      expect(propertiesCount).toBeLessThanOrEqual(3)
    })
  })

  describe('Description length checks', () => {
    const MAX_DESCRIPTION_LENGTH = 500

    it.each(toolNames)('%s description should be concise', (toolName) => {
      const tool = registeredTools[toolName]
      const descLength = tool.description?.length ?? 0

      expect(descLength).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH)
    })
  })
})
