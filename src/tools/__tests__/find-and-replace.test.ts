import { describe, expect, it } from 'vitest'
import { replaceText, textMatches } from '../find-and-replace-in-page.js'

describe('find-and-replace-in-page utilities', () => {
  describe('textMatches', () => {
    describe('string matching (useRegex: false)', () => {
      it('should match exact substring', () => {
        expect(textMatches('Hello World', 'World', false)).toBe(true)
      })

      it('should match partial substring', () => {
        expect(textMatches('Hello World', 'llo', false)).toBe(true)
      })

      it('should return false when no match', () => {
        expect(textMatches('Hello World', 'Foo', false)).toBe(false)
      })

      it('should be case sensitive', () => {
        expect(textMatches('Hello World', 'world', false)).toBe(false)
      })

      it('should handle empty search string', () => {
        expect(textMatches('Hello World', '', false)).toBe(true)
      })

      it('should handle empty text', () => {
        expect(textMatches('', 'Hello', false)).toBe(false)
      })

      it('should handle Japanese text', () => {
        expect(textMatches('こんにちは世界', '世界', false)).toBe(true)
      })
    })

    describe('regex matching (useRegex: true)', () => {
      it('should match with simple regex', () => {
        expect(textMatches('Hello World', 'World', true)).toBe(true)
      })

      it('should match with regex pattern', () => {
        expect(textMatches('Hello123World', '\\d+', true)).toBe(true)
      })

      it('should match with character class', () => {
        expect(textMatches('item1', 'item\\d', true)).toBe(true)
      })

      it('should return false when regex does not match', () => {
        expect(textMatches('Hello World', '^World', true)).toBe(false)
      })

      it('should handle invalid regex gracefully (fallback to string match)', () => {
        expect(textMatches('Hello [World', '[World', true)).toBe(true)
      })

      it('should handle regex special characters', () => {
        expect(textMatches('Hello.World', '\\.', true)).toBe(true)
      })
    })
  })

  describe('replaceText', () => {
    describe('string replacement (useRegex: false)', () => {
      it('should replace exact match', () => {
        expect(replaceText('Hello World', 'World', 'Universe', false)).toBe('Hello Universe')
      })

      it('should replace all occurrences', () => {
        expect(replaceText('foo bar foo baz foo', 'foo', 'qux', false)).toBe('qux bar qux baz qux')
      })

      it('should handle no match', () => {
        expect(replaceText('Hello World', 'Foo', 'Bar', false)).toBe('Hello World')
      })

      it('should handle empty replacement', () => {
        expect(replaceText('Hello World', 'World', '', false)).toBe('Hello ')
      })

      it('should handle Japanese text', () => {
        expect(replaceText('こんにちは世界', '世界', 'ワールド', false)).toBe('こんにちはワールド')
      })

      it('should handle markdown in replacement', () => {
        expect(replaceText('Hello World', 'World', '**Universe**', false)).toBe('Hello **Universe**')
      })
    })

    describe('regex replacement (useRegex: true)', () => {
      it('should replace with simple regex', () => {
        expect(replaceText('Hello World', 'World', 'Universe', true)).toBe('Hello Universe')
      })

      it('should replace with pattern', () => {
        expect(replaceText('item1 item2 item3', 'item\\d', 'x', true)).toBe('x x x')
      })

      it('should handle capture groups', () => {
        expect(replaceText('Hello World', '(World)', '[$1]', true)).toBe('Hello [World]')
      })

      it('should handle invalid regex gracefully (fallback to string replace)', () => {
        // Unclosed bracket is invalid regex, should fallback to string replacement
        expect(replaceText('Hello [incomplete [incomplete', '[incomplete', 'X', true)).toBe('Hello X X')
      })

      it('should handle global replacement', () => {
        expect(replaceText('aaa', 'a', 'b', true)).toBe('bbb')
      })

      it('should handle case-sensitive replacement', () => {
        expect(replaceText('Hello HELLO hello', 'hello', 'hi', true)).toBe('Hello HELLO hi')
      })
    })
  })
})
