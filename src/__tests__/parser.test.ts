import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  Registry, parseinline, parse, splitblocks, splitblocks1,
  splicehtmlmap, defrag,
  Nesting, Block, Inline, block,
  IdenticalInline, MirrorInline, SingleGroupInline, link,
  type Tag,
} from '../index'
import { translate } from '../util'
import { Italic, Bold, Paragraphs, SideBySide, Quote, Katex } from './strategies'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegistry(...elements: Parameters<Registry['add']>[0][]) {
  return new Registry().add(...elements as any)
}

const r = makeRegistry(Paragraphs, Italic, Bold, SideBySide, Quote, Katex)

// Arbitrary for plain text: no `*`, `_`, `-`, `.` sequences that look like
// block markers or inline delimiters. Safe to use as leaf text.
const arbPlainText = fc.stringMatching(/^[a-zA-Z0-9 ,;:!?]+$/).filter(s => s.length > 0)

// Text that contains exactly one bold span
const arbBoldText = fc.tuple(arbPlainText, arbPlainText, arbPlainText)
  .map(([pre, content, post]) => `${pre} *${content}* ${post}`)

// Text that contains exactly one italic span
const arbItalicText = fc.tuple(arbPlainText, arbPlainText, arbPlainText)
  .map(([pre, content, post]) => `${pre} _${content}_ ${post}`)

// ---------------------------------------------------------------------------
// translate()
// ---------------------------------------------------------------------------

describe('translate()', () => {
  it('maps characters from->to', () => {
    const t = translate('abc', 'xyz')
    expect(t('a')).toBe('x')
    expect(t('b')).toBe('y')
    expect(t('c')).toBe('z')
  })

  it('passes through characters not in from', () => {
    const t = translate('abc', 'xyz')
    expect(t('d')).toBe('d')
    expect(t('!')).toBe('!')
  })

  it('translates strings character by character', () => {
    const t = translate('()[]{}<>', ')(][}{><')
    expect(t('(')).toBe(')')
    expect(t(')')).toBe('(')
    expect(t('{++')).toBe('}++')
  })

  it('is used correctly by MirrorInline — mirror of {++ is ++}', () => {
    // MirrorInline reverses the start and translates brackets
    // translate('()[]{}<>', ')(][}{><')(reverse('{++')) == translate('++'+ '{') == '++}'
    const t = translate('()[]{}<>', ')(][}{><')
    expect(t('{++'.split('').reverse().join(''))).toBe('++}')
  })
})

// ---------------------------------------------------------------------------
// Registry.inline_subscriptions()
// ---------------------------------------------------------------------------

describe('Registry.inline_subscriptions()', () => {
  it("returns all inlines when names includes 'all'", () => {
    const result = r.inline_subscriptions(['all'])
    expect(result).toHaveLength(2) // Bold, Italic
    expect(result).toContain(Bold)
    expect(result).toContain(Italic)
  })

  it('returns empty array when names is empty', () => {
    expect(r.inline_subscriptions([])).toEqual([])
  })

  it('returns specifically named inline elements', () => {
    const result = r.inline_subscriptions([Bold])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(Bold)
  })

  it("returns parent's inlines when names includes 'inherit'", () => {
    // Paragraphs has sub=['all'], so inheriting from it gives all inlines
    const result = r.inline_subscriptions(['inherit'], Paragraphs)
    expect(result).toHaveLength(2)
  })

  it("returns registry inlines when parent has 'all' and names is 'inherit'", () => {
    const result = r.inline_subscriptions(['inherit'], Paragraphs)
    expect(result).toEqual(r.inlines())
  })
})

// ---------------------------------------------------------------------------
// parseinline()
// ---------------------------------------------------------------------------

describe('parseinline()', () => {
  it('returns empty array for empty string', () => {
    expect(parseinline(r, Paragraphs, '')).toEqual([])
  })

  it('returns [text] when text has no inline markers', () => {
    fc.assert(fc.property(arbPlainText, (text) => {
      const result = parseinline(r, Paragraphs, text)
      expect(result).toEqual([text])
    }))
  })

  it('parses *text* into a strong tag', () => {
    const result = parseinline(r, Paragraphs, 'hello *world* end')
    // should have 3 parts: 'hello ', Tag, ' end'
    expect(result).toHaveLength(3)
    expect(result[0]).toBe('hello ')
    const tag = result[1] as Tag
    expect(tag[0]).toEqual(['strong', {}])
    expect(tag[1]).toBe('world')
    expect(result[2]).toBe(' end')
  })

  it('parses _text_ into an em tag', () => {
    const result = parseinline(r, Paragraphs, 'hello _world_ end')
    expect(result).toHaveLength(3)
    const tag = result[1] as Tag
    expect(tag[0]).toEqual(['em', {}])
  })

  it('handles multiple inline elements in one string', () => {
    const result = parseinline(r, Paragraphs, '*bold* and _italic_')
    // 'bold' tag, ' and ', 'italic' tag
    expect(result.length).toBeGreaterThan(1)
    const tags = result.filter(x => Array.isArray(x)) as Tag[]
    expect(tags).toHaveLength(2)
  })

  it('escaped delimiter is not parsed as inline', () => {
    const result = parseinline(r, Paragraphs, 'not \\*bold\\*')
    // the escaped asterisks should not produce a tag
    expect(result.every(x => typeof x === 'string' || (x as Tag)[0][0] !== 'strong')).toBe(true)
  })

  it('property: never throws on arbitrary text', () => {
    fc.assert(fc.property(fc.string(), (text) => {
      expect(() => parseinline(r, Paragraphs, text)).not.toThrow()
    }))
  })

  it('property: bold markers in text always produce a strong tag', () => {
    fc.assert(fc.property(arbBoldText, (text) => {
      const result = parseinline(r, Paragraphs, text)
      const tags = result.filter(x => Array.isArray(x)) as Tag[]
      expect(tags.some(t => (t[0] as [string, object])[0] === 'strong')).toBe(true)
    }))
  })

  it('property: italic markers in text always produce an em tag', () => {
    fc.assert(fc.property(arbItalicText, (text) => {
      const result = parseinline(r, Paragraphs, text)
      const tags = result.filter(x => Array.isArray(x)) as Tag[]
      expect(tags.some(t => (t[0] as [string, object])[0] === 'em')).toBe(true)
    }))
  })
})

// ---------------------------------------------------------------------------
// splitblocks()
// ---------------------------------------------------------------------------

describe('splitblocks()', () => {
  it('text with no blocks returns flat array of strings', () => {
    const result = splitblocks('hello\nworld')
    expect(result.every(x => typeof x === 'string')).toBe(true)
  })

  it('parses a simple block into a branch', () => {
    const result = splitblocks('---quote\nhello\n...')
    expect(result).toHaveLength(1)
    const block = result[0] as any[]
    expect(block[0]).toMatchObject({ name: 'quote' })
    expect(block[1]).toBe('hello')
  })

  it('text before and after a block is preserved as leaves', () => {
    const result = splitblocks('before\n---quote\nhello\n...\nafter')
    expect(result[0]).toBe('before')
    expect(result[result.length - 1]).toBe('after')
  })

  it('gracefully handles unclosed blocks (no end token)', () => {
    // should not throw, just consumes to EOF
    expect(() => splitblocks('---quote\nhello')).not.toThrow()
  })

  it('parses nested blocks correctly', () => {
    const text = '---side-by-side\n---quote\nhello\n...\n...'
    const result = splitblocks(text)
    expect(result).toHaveLength(1)
    const outer = result[0] as any[]
    expect(outer[0]).toMatchObject({ name: 'side-by-side' })
    // inner block is nested
    const inner = outer[1] as any[]
    expect(inner[0]).toMatchObject({ name: 'quote' })
  })
})

// ---------------------------------------------------------------------------
// parse() — Nesting.NONE (terminal block)
// ---------------------------------------------------------------------------

describe('parse() with Nesting.NONE', () => {
  it('returns the block parse output verbatim', () => {
    const result = parse(r, [{ name: 'katex', args: '' }, 'f(x) = 2x'])
    expect(result[0]).toEqual(['div.katex', {}])
    expect(result[1]).toBe('f(x) = 2x')
  })

  it('does not process inline markers inside terminal blocks', () => {
    const result = parse(r, [{ name: 'katex', args: '' }, '*not bold*'])
    // the raw string should survive untouched
    expect(result[1]).toBe('*not bold*')
  })
})

// ---------------------------------------------------------------------------
// parse() — Nesting.POST (default block)
// ---------------------------------------------------------------------------

describe('parse() with Nesting.POST', () => {
  it('processes inline elements in child text', () => {
    const result = parse(r, [{ name: 'quote', args: '' }, 'hello *world*'])
    // result should be a tag tree; find the strong tag somewhere in it
    const str = JSON.stringify(result)
    expect(str).toContain('strong')
  })

  it('property: any bold text inside a POST block produces a strong tag in output', () => {
    fc.assert(fc.property(arbBoldText, (text) => {
      const result = parse(r, [{ name: 'quote', args: '' }, text])
      expect(JSON.stringify(result)).toContain('strong')
    }))
  })
})

// ---------------------------------------------------------------------------
// parse() — Nesting.SUB
// ---------------------------------------------------------------------------

describe('parse() with Nesting.SUB', () => {
  it('wraps paragraphs in <p> tags', () => {
    const result = parse(r, [{ name: 'paragraphs', args: '' }, 'first paragraph\n\nsecond paragraph'])
    const str = JSON.stringify(result)
    expect(str).toContain('"p"')
  })

  it('processes inline elements within paragraph text', () => {
    const result = parse(r, [{ name: 'paragraphs', args: '' }, 'hello *world*'])
    expect(JSON.stringify(result)).toContain('strong')
  })

  it('expands nested sub-blocks in SUB context', () => {
    const text = 'intro\n\n---katex\nf(x)\n...\n\noutro'
    const result = parse(r, [{ name: 'paragraphs', args: '' }, text])
    expect(JSON.stringify(result)).toContain('katex')
  })

  it('property: SUB parse never throws on paragraphs with plain text', () => {
    fc.assert(fc.property(
      fc.array(arbPlainText, { minLength: 1, maxLength: 5 }).map(ps => ps.join('\n\n')),
      (text) => {
        expect(() => parse(r, [{ name: 'paragraphs', args: '' }, text])).not.toThrow()
      }
    ))
  })
})

// ---------------------------------------------------------------------------
// parse() — block with no args (regression for getopts crash)
// ---------------------------------------------------------------------------

describe('parse() args handling', () => {
  it('does not crash when block has no args field', () => {
    // splitblocks returns {name, args} where args may be undefined
    const result = splitblocks('---quote\nhello\n...')
    expect(() => parse(r, result[0] as any)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// splitblocks1()
// ---------------------------------------------------------------------------

describe('splitblocks1()', () => {
  it('text with no blocks returns flat strings', () => {
    const result = splitblocks1('hello\nworld')
    expect(result.every(x => typeof x === 'string')).toBe(true)
  })

  it('parses a simple block into a branch', () => {
    const result = splitblocks1('---quote\nhello\n...')
    expect(result).toHaveLength(1)
    const blk = result[0] as any[]
    expect(blk[0]).toMatchObject({ name: 'quote' })
    expect(blk[1]).toBe('hello')
  })

  it('inner blocks are NOT recursed — kept as raw strings', () => {
    // forestify1 does not increment level for inner starts, so one '...' closes ---outer
    const text = '---outer\n---inner\nhello\n...'
    const result = splitblocks1(text)
    expect(result).toHaveLength(1)
    const outer = result[0] as any[]
    // '---inner' should be a raw string, not a parsed branch
    expect(outer.slice(1).some((x: any) => typeof x === 'string' && x.includes('---inner'))).toBe(true)
  })

  it('preserves leaves before and after block', () => {
    const result = splitblocks1('before\n---quote\nx\n...\nafter')
    expect(result[0]).toContain('before')
    expect(result[result.length - 1]).toContain('after')
  })

  it('multiple sibling blocks parsed correctly', () => {
    const result = splitblocks1('---quote\na\n...\n---quote\nb\n...')
    expect(result).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// defrag() / splicehtmlmap()
// ---------------------------------------------------------------------------

describe('defrag()', () => {
  it('removes <> fragment wrapper and promotes its children', () => {
    const tag: Tag = [['root', {}], [['<>', {}], 'a', 'b'], 'c']
    const result = defrag(tag)
    expect(result).toEqual([['root', {}], 'a', 'b', 'c'])
  })

  it('non-fragment nodes are untouched', () => {
    const tag: Tag = [['div', {}], [['span', {}], 'hello'], 'world']
    const result = defrag(tag)
    expect(result).toEqual(tag)
  })

  it('nested fragments are collapsed', () => {
    const tag: Tag = [['root', {}], [['<>', {}], [['<>', {}], 'deep'], 'sibling']]
    const result = defrag(tag)
    // top-level <> is removed; inner <> becomes a child of root
    expect(JSON.stringify(result)).not.toContain('"<>"')
  })
})

describe('splicehtmlmap()', () => {
  it('applies function to all leaf strings in tag tree', () => {
    const tag: Tag = [['div', {}], 'hello', [['span', {}], 'world']]
    const result = splicehtmlmap(t => [t.toUpperCase()], tag)
    expect(result).toEqual([['div', {}], 'HELLO', [['span', {}], 'WORLD']])
  })

  it('can expand one leaf into multiple', () => {
    const tag: Tag = [['div', {}], 'ab']
    const result = splicehtmlmap(t => t.split(''), tag)
    expect(result).toEqual([['div', {}], 'a', 'b'])
  })

  it('identity function leaves tag unchanged', () => {
    const tag: Tag = [['div', {}], 'hello', [['span', {}], 'world']]
    const result = splicehtmlmap(t => [t], tag)
    expect(result).toEqual(tag)
  })
})

// ---------------------------------------------------------------------------
// Registry — methods not previously tested
// ---------------------------------------------------------------------------

describe('Registry methods', () => {
  it('add() stores elements by name', () => {
    const reg = new Registry().add(Quote, Katex)
    expect(reg.has('quote')).toBe(true)
    expect(reg.has('katex')).toBe(true)
    expect(reg.size).toBe(2)
  })

  it('add() accepts [name, element] tuple to override name', () => {
    const reg = new Registry().add(['myquote', Quote])
    expect(reg.has('myquote')).toBe(true)
    expect(reg.has('quote')).toBe(false)
  })

  it('resolve() by string returns the element', () => {
    expect(r.resolve('quote')).toBe(Quote)
    expect(r.resolve('katex')).toBe(Katex)
  })

  it('resolve() by element instance returns it directly', () => {
    expect(r.resolve(Quote)).toBe(Quote)
  })

  it('resolve() throws for unknown element name', () => {
    expect(() => r.resolve('nonexistent')).toThrow()
  })

  it('inlines() returns only Inline elements', () => {
    const inlines = r.inlines()
    expect(inlines.every(e => e instanceof Inline)).toBe(true)
    expect(inlines).toContain(Bold)
    expect(inlines).toContain(Italic)
    expect(inlines).not.toContain(Paragraphs)
  })

  it('blocks() returns only Block elements', () => {
    const blocks = r.blocks()
    expect(blocks.every(e => e instanceof Block)).toBe(true)
    expect(blocks).toContain(Paragraphs)
    expect(blocks).toContain(Quote)
    expect(blocks).not.toContain(Bold)
  })

  it('inlines() + blocks() covers all elements', () => {
    expect(r.inlines().length + r.blocks().length).toBe(r.size)
  })
})

// ---------------------------------------------------------------------------
// Element.sub()
// ---------------------------------------------------------------------------

describe('Element.sub()', () => {
  it('returns ["all"] when sub=["all"]', () => {
    // Paragraphs defaults to sub=['all']
    expect(Paragraphs.sub(Inline)).toContain('all')
  })

  it('returns only Inline elements when sub has specific inlines', () => {
    const reg = new Registry().add(Bold, Italic)
    const elem = reg.resolve('bold')
    // Bold has sub=['all'] by default via IdenticalInline
    expect(elem.sub(Inline)).toContain('all')
  })

  it('returns ["inherit"] when sub contains inherit', () => {
    const e = block(Nesting.POST, ['inherit' as any])(function testElem() { return [['div', {}]] as any })
    expect(e.subElements).toContain('inherit')
    expect(e.sub(Inline)).toContain('inherit')
  })
})

// ---------------------------------------------------------------------------
// Inline.validate()
// ---------------------------------------------------------------------------

describe('Inline.validate()', () => {
  it('INLINE display does not require anchors — always valid', () => {
    expect(Italic.validate()).toBe(true)
    expect(Bold.validate()).toBe(true)
  })

  it('BLOCK display without ^ and $ fails validation', () => {
    const badInline = SingleGroupInline('bad', '_', '_', 'em')
    // Force display to BLOCK to test validation
    ;(badInline as any).display = 0 // Display.BLOCK = 0 (first in enum)
    expect(badInline.validate()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MirrorInline()
// ---------------------------------------------------------------------------

describe('MirrorInline()', () => {
  const CriticAdd = MirrorInline('criticAdd', '{++', 'ins')

  it('creates an inline element with the correct name', () => {
    expect(CriticAdd.name).toBe('critic-add')
  })

  it('matches {++ text ++} pattern', () => {
    const reg = new Registry().add(Paragraphs, CriticAdd)
    const result = parseinline(reg, Paragraphs, 'a {++inserted++} b')
    const tags = result.filter(x => Array.isArray(x)) as Tag[]
    expect(tags.some(t => (t[0] as any)[0] === 'ins')).toBe(true)
  })

  it('the mirrored end delimiter is correct', () => {
    // {++ should mirror to ++}
    const src = CriticAdd.regex.source
    expect(src).toContain('\\+\\+\\}')
  })
})

// ---------------------------------------------------------------------------
// link() helper
// ---------------------------------------------------------------------------

describe('link()', () => {
  const Link = link('')(function linkParser(groups: string[]) {
    return [['a', { href: groups[1] }], groups[0]] as Tag
  })

  it('creates an inline element', () => {
    expect(Link).toBeInstanceOf(Inline)
  })

  it('parses [text](url) syntax', () => {
    const reg = new Registry().add(Paragraphs, Link)
    const result = parseinline(reg, Paragraphs, '[click here](https://example.com)')
    const tags = result.filter(x => Array.isArray(x)) as Tag[]
    expect(tags.length).toBeGreaterThan(0)
    expect(JSON.stringify(tags)).toContain('"a"')
  })
})
