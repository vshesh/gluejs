import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Registry, Block, Inline, Nesting } from '../index'
import { Bold, Italic, Monospace, Paragraphs, Link, CriticAdd, Standard, StandardInline, CriticMarkup } from '../library'
import { IdenticalInline, block } from '../elements'

const arbName = fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/)

describe('Registry algebra', () => {
  it('constructs from an iterable and looks up by name', () => {
    const r = new Registry([Bold, Italic, Paragraphs])
    expect(r.get('bold')).toBe(Bold)
    expect(r.get('italic')).toBe(Italic)
    expect(r.has('paragraphs')).toBe(true)
  })

  it('add is fluent and mutating', () => {
    const r = new Registry()
    expect(r.add(Bold, Italic)).toBe(r)
    expect(r.size).toBe(2)
  })

  it('remove deletes by element or name', () => {
    const r = new Registry([Bold, Italic, Monospace])
    r.remove(Italic, 'monospace')
    expect(r.has('italic')).toBe(false)
    expect(r.has('monospace')).toBe(false)
    expect(r.has('bold')).toBe(true)
  })

  it('plus/minus/merge do not mutate the original', () => {
    const r = new Registry([Bold, Italic])
    const added = r.plus([Monospace])
    const gone = r.minus([Italic])
    const merged = r.merge(new Registry([Link]))
    expect(r.has('monospace')).toBe(false)
    expect(r.has('italic')).toBe(true)
    expect(r.has('link')).toBe(false)
    expect(added.has('monospace')).toBe(true)
    expect(gone.has('italic')).toBe(false)
    expect(merged.has('link')).toBe(true)
  })

  it('merge prefers the right-hand registry on name clash', () => {
    const left = new Registry([Bold])
    const renamed = Bold.with({ name: 'bold' })
    const right = new Registry().add(['bold', IdenticalInline('strongish', '*', 'b')])
    expect(left.merge(right).get('bold')).toBe(right.get('bold'))
  })

  it('clone copies top', () => {
    const r = new Registry([Paragraphs], { top: Paragraphs })
    expect(r.clone().top).toBe(Paragraphs)
  })

  it('inlines() / blocks() partition the registry', () => {
    const r = new Registry([Bold, Italic, Paragraphs])
    expect(r.inlines().every(x => x instanceof Inline)).toBe(true)
    expect(r.blocks().every(x => x instanceof Block)).toBe(true)
    expect(r.inlines().length + r.blocks().length).toBe(r.size)
  })

  it('validate requires a top Block', () => {
    expect(new Registry([Bold]).validate()).toBe(false)
    expect(new Registry([Paragraphs], { top: Paragraphs }).validate()).toBe(true)
  })

  it('Standard is composed from StandardInline | CriticMarkup | blocks', () => {
    for (const n of StandardInline.keys()) expect(Standard.has(n)).toBe(true)
    for (const n of CriticMarkup.keys()) expect(Standard.has(n)).toBe(true)
    expect(Standard.top?.name).toBe('paragraphs')
  })

  it('property: plus(xs).minus(xs) restores membership of the original keys', () => {
    fc.assert(fc.property(fc.array(arbName, { minLength: 1, maxLength: 5 }), names => {
      const extras = names.map(n => IdenticalInline(n, '%', 'span'))
      const base = new Registry([Bold, Paragraphs], { top: Paragraphs })
      const round = base.plus(extras).minus(extras)
      expect([...round.keys()].sort()).toEqual([...base.keys()].sort())
    }))
  })

  it('property: merge is associative on keys', () => {
    const a = new Registry([Bold])
    const b = new Registry([Italic])
    const c = new Registry([Monospace])
    const left = a.merge(b).merge(c)
    const right = a.merge(b.merge(c))
    expect([...left.keys()].sort()).toEqual([...right.keys()].sort())
  })

  it('inline_subscriptions("all") is the full inline set', () => {
    const r = new Registry([Bold, Italic, Paragraphs])
    expect(r.inline_subscriptions(['all'])).toEqual(r.inlines())
  })

  it('inline_subscriptions("inherit") follows the parent', () => {
    const r = new Registry([Bold, Italic, Paragraphs])
    expect(r.inline_subscriptions(['inherit'], Paragraphs)).toEqual(r.inlines())
  })
})

describe('Element.with / validate', () => {
  it('with() copies and overrides without mutating the original', () => {
    const next = Bold.with({ name: 'strongish' })
    expect(next.name).toBe('strongish')
    expect(Bold.name).toBe('bold')
    expect(next).not.toBe(Bold)
  })

  it('NONE blocks must not subscribe to children', () => {
    const bad = block(Nesting.NONE, ['all'])(function x(): any { return [['div', {}]] })
    expect(bad.validate()).toBe(false)
    const ok = block(Nesting.NONE, [])(function y(): any { return [['div', {}]] })
    expect(ok.validate()).toBe(true)
  })
})
