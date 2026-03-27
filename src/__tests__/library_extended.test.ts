import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  CriticAdd, CriticDel, CriticHighlight, CriticComment, CriticSub,
  UnorderedList, OrderedList,
  CriticMarkup, StandardExtended,
  Paragraphs,
} from '../library'
import { render } from '../html'
import { parse, parseinline, Registry } from '../index'
import type { Tag } from '../index'

// ---------------------------------------------------------------------------
// CriticMarkup inline elements
// ---------------------------------------------------------------------------

describe('CriticAdd', () => {
  it('has name "critic-add"', () => expect(CriticAdd.name).toBe('critic-add'))

  it('{++text++} renders as <ins>', () => {
    const reg = new Registry().add(Paragraphs, CriticAdd)
    const result = parseinline(reg, Paragraphs, '{++added++}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<ins>')
    expect(html).toContain('added')
  })
})

describe('CriticDel', () => {
  it('has name "critic-del"', () => expect(CriticDel.name).toBe('critic-del'))

  it('{--text--} renders as <del>', () => {
    const reg = new Registry().add(Paragraphs, CriticDel)
    const result = parseinline(reg, Paragraphs, '{--deleted--}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<del>')
    expect(html).toContain('deleted')
  })
})

describe('CriticHighlight', () => {
  it('has name "critic-highlight"', () => expect(CriticHighlight.name).toBe('critic-highlight'))

  it('{==text==} renders as <mark>', () => {
    const reg = new Registry().add(Paragraphs, CriticHighlight)
    const result = parseinline(reg, Paragraphs, '{==highlighted==}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<mark>')
    expect(html).toContain('highlighted')
  })
})

describe('CriticComment', () => {
  it('has name "critic-comment"', () => expect(CriticComment.name).toBe('critic-comment'))

  it('{>>text<<} renders as <span> with critic comment class', () => {
    const reg = new Registry().add(Paragraphs, CriticComment)
    const result = parseinline(reg, Paragraphs, '{>>a comment<<}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<span')
    expect(html).toContain('critic')
    expect(html).toContain('a comment')
  })
})

describe('CriticSub', () => {
  it('has name "critic-sub"', () => expect(CriticSub.name).toBe('critic-sub'))

  it('{~~old~>new~~} renders old as <del> and new as <ins>', () => {
    const reg = new Registry().add(Paragraphs, CriticSub)
    const result = parseinline(reg, Paragraphs, '{~~old~>new~~}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<del>')
    expect(html).toContain('<ins>')
    expect(html).toContain('old')
    expect(html).toContain('new')
  })
})

// ---------------------------------------------------------------------------
// List block elements
// ---------------------------------------------------------------------------

describe('UnorderedList', () => {
  it('has name "unordered-list"', () => expect(UnorderedList.name).toBe('unordered-list'))

  it('renders lines starting with - as <li> inside <ul>', () => {
    const reg = new Registry().add(UnorderedList)
    const tag = parse(reg, [{ name: 'unordered-list', args: '' }, '- item one\n- item two\n- item three'])
    const html = render(tag)
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
    expect(html).toContain('item one')
    expect(html).toContain('item two')
    expect(html).toContain('item three')
  })

  it('strips the leading - from each item', () => {
    const reg = new Registry().add(UnorderedList)
    const tag = parse(reg, [{ name: 'unordered-list', args: '' }, '- only item'])
    const html = render(tag)
    expect(html).not.toContain('- only')
    expect(html).toContain('only item')
  })
})

describe('OrderedList', () => {
  it('has name "ordered-list"', () => expect(OrderedList.name).toBe('ordered-list'))

  it('renders numbered lines as <li> inside <ol>', () => {
    const reg = new Registry().add(OrderedList)
    const tag = parse(reg, [{ name: 'ordered-list', args: '' }, '1. first\n2. second\n3. third'])
    const html = render(tag)
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>')
    expect(html).toContain('first')
    expect(html).toContain('second')
  })

  it('strips the leading number from each item', () => {
    const reg = new Registry().add(OrderedList)
    const tag = parse(reg, [{ name: 'ordered-list', args: '' }, '1. only item'])
    const html = render(tag)
    expect(html).not.toContain('1.')
    expect(html).toContain('only item')
  })
})

// ---------------------------------------------------------------------------
// CriticMarkup registry
// ---------------------------------------------------------------------------

describe('CriticMarkup registry', () => {
  it('contains all critic elements', () => {
    const names = CriticMarkup.inlines().map(e => e.name)
    expect(names).toContain('critic-add')
    expect(names).toContain('critic-del')
    expect(names).toContain('critic-highlight')
    expect(names).toContain('critic-comment')
    expect(names).toContain('critic-sub')
  })

  it('does not include non-critic elements', () => {
    const names = CriticMarkup.inlines().map(e => e.name)
    expect(names).not.toContain('bold')
    expect(names).not.toContain('italic')
  })
})

// ---------------------------------------------------------------------------
// StandardExtended registry
// ---------------------------------------------------------------------------

describe('StandardExtended registry', () => {
  it('contains all Standard elements plus critic and list elements', () => {
    const inlineNames = StandardExtended.inlines().map(e => e.name)
    const blockNames = StandardExtended.blocks().map(e => e.name)

    // Standard inline elements
    expect(inlineNames).toContain('bold')
    expect(inlineNames).toContain('italic')

    // Extended inline elements
    expect(inlineNames).toContain('critic-add')
    expect(inlineNames).toContain('critic-del')

    // Extended block elements
    expect(blockNames).toContain('unordered-list')
    expect(blockNames).toContain('ordered-list')
  })

  it('property: critic markup renders without throwing', () => {
    fc.assert(fc.property(
      fc.string().filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.length > 0),
      content => {
        const text = `before {++${content}++} after`
        expect(() => {
          const result = parseinline(StandardExtended, Paragraphs, text)
          render([['div', {}], ...result] as Tag)
        }).not.toThrow()
      }
    ))
  })
})
