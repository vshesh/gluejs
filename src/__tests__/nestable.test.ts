import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  realQ,
  isLeaf, value, construct, branch, attach,
  forestify, forestify1, forestify_, check,
  coalesce, transformleaves, concat,
  type ArrayBranch, type ArrayTree,
} from '../nestable'

// ---------------------------------------------------------------------------
// Helpers / Arbitraries
// ---------------------------------------------------------------------------

// Small arbitrary for ArrayBranch<string, number> — bounded depth to avoid blowup
const arbLeaf = fc.integer({ min: 0, max: 99 })
const arbBranch: fc.Arbitrary<ArrayBranch<string, number>> = fc.letrec(tie => ({
  branch: fc.oneof(
    { depthSize: 'small' },
    fc.tuple(fc.string({ minLength: 1, maxLength: 4 }), arbLeaf).map(([h, l]) => [h, l] as ArrayBranch<string, number>),
    fc.tuple(
      fc.string({ minLength: 1, maxLength: 4 }),
      arbLeaf,
      tie('branch') as fc.Arbitrary<ArrayBranch<string, number>>,
    ).map(([h, l, sub]) => [h, l, sub] as ArrayBranch<string, number>),
  ),
})).branch

// Block-syntax token helpers for forestify
const START = (t: string) => { const m = t.match(/^---(\w+)$/); return m ? { name: m[1] } : undefined }
const END   = (t: string) => t === '...' ? {} : undefined

// ---------------------------------------------------------------------------
// realQ
// ---------------------------------------------------------------------------

describe('realQ()', () => {
  it('returns false for null', () => expect(realQ(null)).toBe(false))
  it('returns false for undefined', () => expect(realQ(undefined)).toBe(false))
  it('returns true for 0', () => expect(realQ(0)).toBe(true))
  it('returns true for empty string', () => expect(realQ('')).toBe(true))
  it('returns true for false', () => expect(realQ(false)).toBe(true))
  it('property: always true for arbitrary non-null values', () => {
    fc.assert(fc.property(fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.array(fc.string())), v => realQ(v) === true))
  })
})

// ---------------------------------------------------------------------------
// isLeaf / value / construct / branch / attach
// ---------------------------------------------------------------------------

describe('isLeaf()', () => {
  it('true for strings', () => expect(isLeaf('hello')).toBe(true))
  it('true for numbers', () => expect(isLeaf(42)).toBe(true))
  it('false for arrays', () => expect(isLeaf(['a', 1])).toBe(false))
  it('property: construct always produces non-leaf', () => {
    fc.assert(fc.property(fc.string(), fc.array(arbLeaf), (b, bs) =>
      isLeaf(construct(b, bs)) === false
    ))
  })
})

describe('value()', () => {
  it('returns head of branch', () => expect(value(['head', 1, 2])).toBe('head'))
  it('property: value(construct(b, bs)) === b', () => {
    fc.assert(fc.property(fc.string(), fc.array(arbLeaf), (b, bs) =>
      value(construct(b, bs)) === b
    ))
  })
})

describe('construct()', () => {
  it('builds [head, ...children]', () => expect(construct('a', [1, 2, 3])).toEqual(['a', 1, 2, 3]))
  it('empty children gives singleton branch', () => expect(construct('a', [])).toEqual(['a']))
  it('property: length is children.length + 1', () => {
    fc.assert(fc.property(fc.string(), fc.array(arbLeaf), (b, bs) =>
      construct(b, bs).length === bs.length + 1
    ))
  })
})

describe('branch()', () => {
  it('returns children of a branch', () => expect(branch(['a', 1, 2, 3])).toEqual([1, 2, 3]))
  it('returns empty array for a leaf', () => expect(branch(42 as any)).toEqual([]))
  it('returns empty array for a singleton branch', () => expect(branch(['a'])).toEqual([]))
  it('property: branch(construct(b, bs)) deeply equals bs', () => {
    fc.assert(fc.property(fc.string(), fc.array(arbLeaf), (b, bs) =>
      JSON.stringify(branch(construct(b, bs))) === JSON.stringify(bs)
    ))
  })
})

describe('attach()', () => {
  it('appends branches', () => expect(attach(['a', 1], [2, 3])).toEqual(['a', 1, 2, 3]))
  it('appending empty array is identity', () => {
    fc.assert(fc.property(arbBranch, n => JSON.stringify(attach(n, [])) === JSON.stringify(n)))
  })
  it('property: length grows by number of attached items', () => {
    fc.assert(fc.property(arbBranch, fc.array(arbLeaf), (n, bs) =>
      attach(n, bs).length === n.length + bs.length
    ))
  })
})

// ---------------------------------------------------------------------------
// check()
// ---------------------------------------------------------------------------

describe('check()', () => {
  it('regex: returns groups on match', () => {
    const result = check(/^(?<name>\w+)$/)('hello')
    expect(result).toEqual({ name: 'hello' })
  })

  it('regex: returns undefined on no match', () => {
    expect(check(/^---(\w+)$/)('hello')).toBeUndefined()
  })

  it('string: returns {name} on exact match', () => {
    expect(check('foo')('foo')).toEqual({ name: 'foo' })
  })

  it('string: returns undefined on non-match', () => {
    expect(check('foo')('bar')).toBeUndefined()
  })

  it('property: always returns object or undefined, never throws', () => {
    fc.assert(fc.property(fc.string(), fc.string(), (pattern, input) => {
      let result: any
      expect(() => { result = check(pattern)(input) }).not.toThrow()
      expect(result === undefined || typeof result === 'object').toBe(true)
    }))
  })
})

// ---------------------------------------------------------------------------
// forestify()
// ---------------------------------------------------------------------------

describe('forestify()', () => {
  it('tokens with no delimiters → flat list of leaves', () => {
    const [tree] = forestify(START, END, ['a', 'b', 'c'])
    expect(tree).toEqual(['a', 'b', 'c'])
  })

  it('simple block becomes a branch', () => {
    const [tree] = forestify(START, END, ['---foo', 'a', 'b', '...'])
    expect(tree).toHaveLength(1)
    const branch = tree[0] as any[]
    expect(branch[0]).toEqual({ name: 'foo' })
    expect(branch[1]).toBe('a')
    expect(branch[2]).toBe('b')
  })

  it('preserves leaves before and after a block', () => {
    const [tree] = forestify(START, END, ['pre', '---foo', 'a', '...', 'post'])
    expect(tree[0]).toBe('pre')
    expect(tree[2]).toBe('post')
  })

  it('nested blocks produce nested branches', () => {
    const [tree] = forestify(START, END, ['---outer', '---inner', 'x', '...', '...'])
    const outer = tree[0] as any[]
    expect(outer[0]).toEqual({ name: 'outer' })
    const inner = outer[1] as any[]
    expect(inner[0]).toEqual({ name: 'inner' })
    expect(inner[1]).toBe('x')
  })

  it('gracefully handles missing end token — consumes to EOF', () => {
    expect(() => forestify(START, END, ['---foo', 'a', 'b'])).not.toThrow()
  })

  it('extra end token aborts early and returns remaining as error note', () => {
    // forestify_ wraps this and reports the error — raw forestify returns early
    const [tree, endIdx] = forestify(START, END, ['a', '...', 'b'])
    expect(endIdx).toBe(2) // stopped at the '...'
  })
})

// ---------------------------------------------------------------------------
// forestify1()
// ---------------------------------------------------------------------------

describe('forestify1()', () => {
  it('tokens with no delimiters → flat list of leaves', () => {
    const result = forestify1(START, END, ['a', 'b', 'c'])
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('block tokens are captured as a branch with raw inner tokens', () => {
    const result = forestify1(START, END, ['---foo', 'a', 'b', '...'])
    expect(result).toHaveLength(1)
    const blk = result[0] as any[]
    expect(blk[0]).toEqual({ name: 'foo' })
    // inner content is raw strings, NOT further parsed into branches
    expect(blk[1]).toBe('a')
    expect(blk[2]).toBe('b')
  })

  it('inner start tokens are NOT recursed — kept as raw strings', () => {
    // forestify1 does NOT track nesting depth for inner starts, so only one '...' closes ---outer
    const result = forestify1(START, END, ['---outer', '---inner', 'x', '...'])
    const outer = result[0] as any[]
    // inner ---inner is stored as a raw string, not a branch
    expect(typeof outer[1]).toBe('string')
    expect(outer[1]).toBe('---inner')
  })

  it('leaves before/after block are preserved', () => {
    const result = forestify1(START, END, ['pre', '---foo', 'x', '...', 'post'])
    expect(result[0]).toBe('pre')
    expect(result[result.length - 1]).toBe('post')
  })

  it('throws on unbalanced end token', () => {
    expect(() => forestify1(START, END, ['a', '...'])).toThrow()
  })
})

// ---------------------------------------------------------------------------
// forestify_()
// ---------------------------------------------------------------------------

describe('forestify_()', () => {
  // forestify_ takes string | RegExp (not function predicates), uses check() internally.
  // Named capture groups required for regex start patterns so check() returns groups object.
  const startRe = /^---(?<name>\w+)$/

  it('returns parsed tree for balanced input', () => {
    const result = forestify_(startRe, '...', ['---foo', 'hello', '...'])
    expect(result).toHaveLength(1)
  })

  it('includes error note for extra end token', () => {
    const result = forestify_(startRe, '...', ['a', '...', 'b'])
    // should contain an error string about the extra end token
    const errorEntry = result.find(x => typeof x === 'string' && (x as string).startsWith('Found'))
    expect(errorEntry).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// coalesce()
// ---------------------------------------------------------------------------

describe('coalesce()', () => {
  it('removes wrapper node and promotes its children', () => {
    const tree: ArrayBranch<string, number> = ['x', 1, ['y', 2, 3], 4]
    const result = coalesce(n => value(n) === 'y', tree)
    expect(result).toEqual(['x', 1, 2, 3, 4])
  })

  it('non-matching nodes are left untouched', () => {
    const tree: ArrayBranch<string, number> = ['x', 1, ['y', 2, 3], 4]
    const result = coalesce(n => value(n) === 'z', tree)
    expect(result).toEqual(tree)
  })

  it('works with always-false predicate — tree unchanged', () => {
    fc.assert(fc.property(arbBranch, tree => {
      const result = coalesce(() => false, tree)
      expect(JSON.stringify(result)).toBe(JSON.stringify(tree))
    }))
  })

  it('fragment nodes (<>) are the real use case — defrag uses this', () => {
    // defrag removes '<>' wrapper nodes — same as coalesce(n => value(n)[0] === '<>')
    const tree: ArrayBranch<[string, {}], string> = [['root', {}], 'a', [['<>', {}], 'b', 'c'], 'd']
    const result = coalesce(n => (value(n) as any)[0] === '<>', tree as any)
    expect(result).toEqual([['root', {}], 'a', 'b', 'c', 'd'])
  })
})

// ---------------------------------------------------------------------------
// transformleaves()
// ---------------------------------------------------------------------------

describe('transformleaves()', () => {
  it('applies function to each leaf', () => {
    const tree: ArrayBranch<string, number> = ['root', 1, 2, 3]
    const result = transformleaves((x: number) => [x * 2], tree)
    expect(result).toEqual(['root', 2, 4, 6])
  })

  it('works on nested trees', () => {
    const tree: ArrayBranch<string, number> = ['root', 1, ['child', 2, 3]]
    const result = transformleaves((x: number) => [x + 10], tree)
    expect(result).toEqual(['root', 11, ['child', 12, 13]])
  })

  it('can expand one leaf into multiple', () => {
    const tree: ArrayBranch<string, number> = ['root', 1, 2]
    const result = transformleaves((x: number) => [x, x * 10], tree)
    expect(result).toEqual(['root', 1, 10, 2, 20])
  })

  it('property: branch values (non-leaves) are preserved', () => {
    fc.assert(fc.property(arbBranch, tree => {
      const result = transformleaves((x: number) => [x], tree)
      expect(value(result)).toBe(value(tree))
    }))
  })
})

// ---------------------------------------------------------------------------
// concat()
// ---------------------------------------------------------------------------

describe('concat()', () => {
  it('leaf node returns the leaf itself', () => {
    expect(concat(() => '', 'hello' as any)).toBe('hello')
  })

  it('branch node concatenates head + children', () => {
    // f(head) + children.join('\n')
    const tree: ArrayBranch<string, string> = ['root', 'a', 'b']
    const result = concat(h => `[${h}]`, tree)
    expect(result).toBe('[root]a\nb')
  })

  it('nested: recursively concatenates', () => {
    const tree: ArrayBranch<string, string> = ['root', 'a', ['child', 'b', 'c']]
    const result = concat(h => `(${h})`, tree)
    expect(result).toBe('(root)a\n(child)b\nc')
  })
})
