import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { makename, num_groups, escape, format, parseArgs, slug, zipLongest, splitUnescaped, parseYaml } from '../util'

// ---------------------------------------------------------------------------
// makename()
// ---------------------------------------------------------------------------

describe('makename()', () => {
  it('lowercases a simple name', () => expect(makename('Bold')).toBe('bold'))
  it('lowercases already-lowercase name', () => expect(makename('katex')).toBe('katex'))
  it('converts camelCase to kebab-case', () => expect(makename('sideBySide')).toBe('side-by-side'))
  it('converts PascalCase to kebab-case', () => expect(makename('SideBySide')).toBe('side-by-side'))
  it('handles multiple humps', () => expect(makename('myLongElementName')).toBe('my-long-element-name'))
  it('preserves numbers', () => expect(makename('h1')).toBe('h1'))
  it('preserves hyphens', () => expect(makename('already-kebab')).toBe('already-kebab'))
  it('empty string stays empty', () => expect(makename('')).toBe(''))

  it('property: result is always lowercase', () => {
    fc.assert(fc.property(fc.string(), name => makename(name) === makename(name).toLowerCase()))
  })

  it('property: result contains no uppercase letters', () => {
    fc.assert(fc.property(fc.string().filter(s => /^[a-zA-Z]+$/.test(s)), name => !/[A-Z]/.test(makename(name))))
  })

  it('property: idempotent — applying twice gives same result', () => {
    fc.assert(fc.property(fc.string().filter(s => /^[a-zA-Z]+$/.test(s)), name => makename(makename(name)) === makename(name)))
  })
})

// ---------------------------------------------------------------------------
// num_groups()
// ---------------------------------------------------------------------------

describe('num_groups()', () => {
  it('returns 0 for regex with no groups', () => expect(num_groups(/abc/)).toBe(0))
  it('returns 1 for single group', () => expect(num_groups(/(abc)/)).toBe(1))
  it('returns 2 for two groups', () => expect(num_groups(/(a)(b)/)).toBe(2))
  it('returns 3 for three groups', () => expect(num_groups(/()()()/)).toBe(3))
  it('non-capturing groups do not count', () => expect(num_groups(/(?:abc)/)).toBe(0))
  it('mixed capturing and non-capturing', () => expect(num_groups(/(a)(?:b)(c)/)).toBe(2))
  it('nested groups each count', () => expect(num_groups(/((a)(b))/)).toBe(3))
  it('alternation groups count', () => expect(num_groups(/(a)|(b)/)).toBe(2))

  it('property: result is always a non-negative integer', () => {
    // Use simple regexes to avoid catastrophic backtracking
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 10 }),
      count => {
        const pattern = new RegExp('('.repeat(count) + ')'.repeat(count))
        expect(num_groups(pattern)).toBe(count)
      }
    ))
  })
})

// ---------------------------------------------------------------------------
// escape()
// ---------------------------------------------------------------------------

describe('escape()', () => {
  it('escapes dot', () => expect(escape('.')).toBe('\\.'))
  it('escapes asterisk', () => expect(escape('*')).toBe('\\*'))
  it('escapes plus', () => expect(escape('+')).toBe('\\+'))
  it('escapes question mark', () => expect(escape('?')).toBe('\\?'))
  it('escapes caret', () => expect(escape('^')).toBe('\\^'))
  it('escapes dollar', () => expect(escape('$')).toBe('\\$'))
  it('escapes parentheses', () => expect(escape('()')).toBe('\\(\\)'))
  it('escapes brackets', () => expect(escape('[]')).toBe('\\[\\]'))
  it('escapes braces', () => expect(escape('{}')).toBe('\\{\\}'))
  it('escapes pipe', () => expect(escape('|')).toBe('\\|'))
  it('escapes backslash', () => expect(escape('\\')).toBe('\\\\'))
  it('plain alphanumerics are unchanged', () => expect(escape('abc123')).toBe('abc123'))

  it('property: new RegExp(escape(s)).test(s) is always true', () => {
    fc.assert(fc.property(
      fc.string().filter(s => s.length > 0),
      s => new RegExp(escape(s)).test(s)
    ))
  })

  it('property: escaped string matches literally (not as regex metachar)', () => {
    // If we escape '*', matching 'a*b' should not treat * as quantifier
    fc.assert(fc.property(
      fc.string(),
      fc.string(),
      fc.string(),
      (pre, s, post) => {
        const full = pre + s + post
        const escaped = escape(s)
        return new RegExp(escaped).test(full) === full.includes(s)
      }
    ))
  })
})

// ---------------------------------------------------------------------------
// format()
// ---------------------------------------------------------------------------

describe('format()', () => {
  it('basic positional: {0} {1}', () => {
    expect(format('{0} {1}', 'hello', 'world')).toBe('hello world')
  })

  it('implicit positional: {} {}', () => {
    expect(format('{} {}', 'a', 'b')).toBe('a b')
  })

  it('repeated reference to same index', () => {
    expect(format('{0} {0}', 'hi')).toBe('hi hi')
  })

  it('escaped braces {{ → {', () => {
    expect(format('{{}}')).toBe('{}')
  })

  it('used in Patterns — replaces {0} and {1} in template', () => {
    const template = 'start_{0}_middle_{1}_end'
    expect(format(template, 'X', 'Y')).toBe('start_X_middle_Y_end')
  })

  it('throws ValueError when mixing implicit and explicit numbering', () => {
    expect(() => format('{0} {}', 'a', 'b')).toThrow()
  })

  it('property: positional args are substituted correctly', () => {
    fc.assert(fc.property(
      fc.array(fc.string({ minLength: 1, maxLength: 10 }).filter(s => !s.includes('{') && !s.includes('}')), { minLength: 1, maxLength: 5 }),
      args => {
        const template = args.map((_, i) => `{${i}}`).join('-')
        expect(format(template, ...args)).toBe(args.join('-'))
      }
    ))
  })
})

describe('parseArgs()', () => {
  it('collects positionals in _', () => {
    expect(parseArgs(['javascript'])._).toEqual(['javascript'])
  })
  it('boolean short flags', () => {
    expect(parseArgs(['-o'], { o: false }).o).toBe(true)
  })
  it('--key=value', () => {
    expect(parseArgs(['--type=flex']).type).toBe('flex')
  })
  it('property: positionals are preserved in order', () => {
    fc.assert(fc.property(
      fc.array(fc.stringMatching(/^[a-z]{2,8}$/), { minLength: 1, maxLength: 5 }),
      words => JSON.stringify(parseArgs(words)._) === JSON.stringify(words)
    ))
  })
})

describe('slug / zipLongest / splitUnescaped', () => {
  it('slug strips punctuation and dashes spaces', () => {
    expect(slug(' Hello, World! ')).toBe('hello-world')
  })
  it('zipLongest pads with fill', () => {
    expect(zipLongest([['a'], ['b', 'c']], '')).toEqual([['a', 'b'], ['', 'c']])
  })
  it('splitUnescaped respects \\|', () => {
    expect(splitUnescaped('c \\| x', '|')).toEqual(['c \\| x'])
    expect(splitUnescaped('c | x', '|')).toEqual(['c', 'x'])
  })
  it('property: joining zipLongest columns recovers rectangular rows', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 4 }),
      fc.integer({ min: 1, max: 4 }),
      (w, h) => {
        const rows = Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => `${r}${c}`))
        const cols = zipLongest(rows, '')
        const back = zipLongest(cols, '')
        expect(back).toEqual(rows)
      }
    ))
  })
})

describe('parseYaml()', () => {
  it('parses a flat map', () => {
    expect(parseYaml('title: C7\nfret: x 1 1 4 5 1')).toEqual({ title: 'C7', fret: 'x 1 1 4 5 1' })
  })
  it('parses nested maps by indent', () => {
    expect(parseYaml('a:\n  b: 1\n  c: true')).toEqual({ a: { b: 1, c: true } })
  })
  it('parses JSON objects', () => {
    expect(parseYaml('{"x": 2}')).toEqual({ x: 2 })
  })
  it('parses a list of scalars', () => {
    expect(parseYaml('- a\n- b\n- c')).toEqual(['a', 'b', 'c'])
  })
  it('empty string is {}', () => {
    expect(parseYaml('')).toEqual({})
  })
})
