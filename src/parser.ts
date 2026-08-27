import * as R from "ramda";
import {num_groups, parseArgs, type ArgMap} from './util';
import {realQ, coalesce, value, isLeaf, transformleaves, construct, branch, forestify1, forestify_, type ArrayBranch} from "./nestable"
import {Block, Inline, Element, Nesting, InlineParser, BlockOptions, SubElement, Display} from "./elements"


type HTMLAttrs    = {[s:string]: string | number | boolean | {[_:string]: string | number | boolean }}
type HTMLChildren<S> = TagL | S
export type HTML = {
  tag: string,
  attrs?: HTMLAttrs,
  children: HTMLChildren<HTML>[]
}

type TagB = [string, HTMLAttrs]
type TagL = string
export type Tag = ArrayBranch<TagB, TagL>

function isTag(x: any): x is Tag {
  const o = x?.[0]
  return typeof o === 'string' || (Array.isArray(o) && o.length === 2 && typeof o[0] === 'string' && R.type(o[1]) === 'Object')
}


/* ==========================================================================================
                                       REGISTRY FUNCTIONS
============================================================================================= */

export class Registry extends Map<string, Element> {
  top?: Block
  /** bumped on mutation so compiled inline regexes stay in sync */
  rev = 0

  constructor(elements: Iterable<Element> = [], opts: { top?: Block } = {}) {
    super()
    this.add(...elements)
    if (opts.top) this.top = opts.top
  }

  add(...args: (Element | [string, Element])[]) {
    this.rev++
    for (const a of args) {
      if (a instanceof Element) this.set(a.name, a)
      else this.set(...a)
    }
    return this
  }

  remove(...args: (Element | string)[]) {
    this.rev++
    for (const a of args) this.delete(typeof a === 'string' ? a : a.name)
    return this
  }

  clone(): Registry {
    const r = new Registry(this.values(), { top: this.top })
    return r
  }

  /** Copy-union, like python `|`. */
  merge(other: Registry): Registry {
    const r = this.clone()
    for (const [k, v] of other) r.set(k, v)
    if (other.top && !r.top) r.top = other.top
    return r
  }

  /** Copy-add, like python `+`. */
  plus(els: Iterable<Element>): Registry {
    return this.clone().add(...els)
  }

  /** Copy-remove, like python `-`. */
  minus(els: Iterable<Element | string>): Registry {
    return this.clone().remove(...els)
  }

  resolve(e: Element | string): Element {
    if (e instanceof Element) return e
    const v = this.get(e)
    if (v === undefined) throw Error(`Element ${e} not found in registry`)
    return v
  }

  inlines() {
    return Array.from(this.values()).filter((x): x is Inline => x instanceof Inline)
  }

  blocks() {
    return Array.from(this.values()).filter((x): x is Block => x instanceof Block)
  }

  assets() {
    return [...new Set(Array.from(this.values()).flatMap(x => x.assets))].join('\n')
  }

  validate() {
    if (!this.top || !(this.top instanceof Block)) return false
    for (const e of this.values()) if (!e.validate()) return false
    return true
  }

  inline_subscriptions(names: (string | SubElement)[], parent?: Element): Inline[] {
    if (names.includes('all')) return this.inlines()
    let l: Inline[] = []
    if (parent && names.includes('inherit')) {
      if (parent.subElements.includes('all')) return this.inlines()
      l = [...l, ...parent.sub(Inline).filter((x): x is Inline => x instanceof Inline)]
    }
    const named = names.filter((x): x is Inline => x instanceof Inline)
    const byName = names.filter((x): x is string => typeof x === 'string' && x !== 'all' && x !== 'inherit')
      .map(n => this.resolve(n) as Inline)
    return [...l, ...named, ...byName]
  }
}

export function union(r1: Registry, r2: Registry) { return r1.merge(r2) }
export function diff(r1: Registry, r2: Registry) { return r1.minus(r2.values()) }

// ========================================================================================
// ========================================================================================
// ▀█▄   ▀█▀                        ▀██▀▀█▄
//  █▀█   █    ▄▄▄▄  ▄▄▄ ▄▄▄ ▄▄▄     ██   ██  ▄▄▄▄   ▄▄▄ ▄▄   ▄▄▄▄    ▄▄▄▄  ▄▄▄ ▄▄
//  █ ▀█▄ █  ▄█▄▄▄██  ██  ██  █      ██▄▄▄█▀ ▀▀ ▄██   ██▀ ▀▀ ██▄ ▀  ▄█▄▄▄██  ██▀ ▀▀
//  █   ███  ██        ███ ███       ██      ▄█▀ ██   ██     ▄ ▀█▄▄ ██       ██
// ▄█▄   ▀█   ▀█▄▄▄▀    █   █       ▄██▄     ▀█▄▄▀█▀ ▄██▄    █▀▄▄█▀  ▀█▄▄▄▀ ▄██▄
// ========================================================================================
// ========================================================================================

export function splicehtmlmap(f: (t: TagL) => (TagL | Tag)[], html: Tag): Tag {
  return transformleaves(f, html, false)
}

export function defrag(tree: Tag): Tag {
  return coalesce((n: Tag) => value<TagB, TagL>(n)[0] === '<>' || value<TagB, TagL>(n)[0] === '', tree)
}


type Compiled = {
  inlines: [RegExp, InlineParser, Inline][]
  patt: RegExp
  unescape: (t: string) => string
  groupcursors: number[]
}

const compileCache = new WeakMap<Registry, { rev: number, map: Map<string, Compiled> }>()

function compileInlines(registry: Registry, element: Element, parent?: Element): Compiled {
  const slot = compileCache.get(registry)
  const map = slot?.rev === registry.rev ? slot.map : new Map()
  if (slot?.rev !== registry.rev) compileCache.set(registry, { rev: registry.rev, map })
  const key = element.subElements.includes('inherit')
    ? `${element.name}<-${parent?.name ?? ''}`
    : element.name
  const hit = map.get(key)
  if (hit) return hit

  const subinline = registry.inline_subscriptions(element.sub(Inline), parent)
  const inlines: [RegExp, InlineParser, Inline][] = subinline.map(x => [x.regex, x.parse, x])
  const esc = [...new Set(subinline.flatMap(x => [...x.escape]))].join('').replace(/[\]\\^-]/g, '\\$&')
  const unescape = esc.length > 0
    ? (t: string) => t.replace(new RegExp(String.raw`\\([${esc}])`, 'g'), '$1')
    : (t: string) => t
  const patt = inlines.length === 0
    ? /(?!)/
    : new RegExp(inlines.map(x => `(?:${typeof x[0] === 'string' ? x[0] : x[0].source})`).join('|'), 'sgm')
  let acc = 0
  const groupcursors = [0, ...subinline.map(x => (acc += num_groups(x.regex), acc))]
  const compiled: Compiled = { inlines, patt, unescape, groupcursors }
  map.set(key, compiled)
  return compiled
}

type InlineBit = string | { html: Tag, display: Display }

function parseinlineBits(registry: Registry, _element: Element | string, text: string, parent?: Element): InlineBit[] {
  if (text === '') return []

  const element: Element = registry.resolve(_element)
  const { inlines, patt, unescape, groupcursors } = compileInlines(registry, element, parent)
  if (inlines.length === 0) return [unescape(text)]

  const l: InlineBit[] = []
  let ind = 0
  for (const match of text.matchAll(patt)) {
    const start = match.index as number
    const end = start + match[0].length
    if (start > ind) l.push(unescape(text.slice(ind, start)))
    ind = end

    const allgroups = Array.from<string>(match).slice(1)
    const groupind = allgroups.findIndex(x => x !== undefined)
    if (groupind < 0) continue
    const pattind = groupcursors.findIndex(x => x > groupind) - 1
    const [, parser, elem] = inlines[pattind]
    const groups = allgroups.slice(groupcursors[pattind], groupcursors[pattind + 1] ?? Infinity)

    const wrap = (html: Tag): InlineBit => ({ html, display: elem.display })
    switch (elem.nest) {
      case Nesting.FRAME:
        l.push(wrap(splicehtmlmap(t => parseinline(registry, element, t, parent), parser(groups))))
        break
      case Nesting.NONE:
        l.push(wrap(parser(groups)))
        break
      case Nesting.POST: {
        const inheritQ = (elem.sub(Inline) as (string | Inline)[]).includes('inherit')
        l.push(wrap(splicehtmlmap(
          t => parseinline(registry, inheritQ ? element : elem, t, inheritQ ? parent : element),
          parser(groups)
        )))
        break
      }
      case Nesting.SUB:
        l.push(wrap([['', {}], `why does your inline element ${elem.name} have nesting = Nesting.SUB?`]))
        break
    }
  }
  if (ind < text.length) l.push(unescape(text.slice(ind)))
  return l
}

export function parseinline(registry: Registry, _element: Element | string, text: string, parent?: Element): (string | Tag)[] {
  return parseinlineBits(registry, _element, text, parent).map(b => typeof b === 'string' ? b : b.html)
}

function check(test: string | RegExp): (value: string) => { [key: string]: string } | undefined {
  return (function(value: string) {
    if (test instanceof RegExp) return value.match(test)?.groups
    return test === value ? { name: test } : undefined
  })
}


export const BLOCK_START = /^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S[\w_=\- \.@$%*!#,]+)?$/
export const BLOCK_END = /^(?<dummy>\.\.\.\.*)\s*$/

export function splitblocks(text: string) {
  return forestify_(BLOCK_START, BLOCK_END, text.split('\n'))
}

// The difference is that this will only split 1 level, not build a whole tree
// Block nodes always carry at least one string child (empty string for zero-content blocks)
// so parse() can rely on ast.length >= 2 without special-casing.
export function splitblocks1(text: string) {
  return forestify1(check(BLOCK_START), check(BLOCK_END), text.split('\n')).map(
    node => !isLeaf(node) && node.length === 1 ? [...node, ''] as typeof node : node
  )
}


type Head = {[_:string]: string}
export type AST = ArrayBranch<Head, string>

const SLOT = /(\[\|\|?\d+\|?\|])/
const SLOT_FULL = /^\[\|\|?(\d+)\|?\|]$/

function expandSlots(leaf: string, slots: Tag[]): (string | Tag)[] {
  return leaf.split(SLOT).filter(x => x !== '').map(part => {
    const m = part.match(SLOT_FULL)
    return m ? slots[+m[1]] : part
  })
}

function subprepare(registry: Registry, block: Block, text: string, parent?: Block): { body: string, slots: Tag[] } {
  const lexed = splitblocks1(text)
  const slots: Tag[] = []
  const body = lexed.map(node => {
    if (!isLeaf(node)) {
      slots.push(parseNode(registry, node, block))
      return `[||${slots.length - 1}||]`
    }
    return parseinlineBits(registry, block, node, parent).map(bit => {
      if (typeof bit === 'string') return bit
      slots.push(bit.html)
      return bit.display === Display.BLOCK ? `[||${slots.length - 1}||]` : `[|${slots.length - 1}|]`
    }).join('')
  }).join('\n')
  return { body, slots }
}

function resolveTop(registry: Registry, top?: Block | string): Block {
  const e = top == null ? registry.top : typeof top === 'string' ? registry.resolve(top) : top
  if (!e || !(e instanceof Block)) {
    throw Error('No top block. Pass a Block as the third argument or set registry.top.')
  }
  return e
}

/**
 * Parse glue text (or a pre-split AST) into a Tag tree.
 *
 * Document form (python-compatible): `parse(registry, text)` or `parse(registry, text, top)`.
 * AST form: `parse(registry, [{ name, args }, ...lines])`.
 */
export function parse(registry: Registry, input: string | AST | Tag | TagL, top?: Block | string): Tag {
  if (typeof input === 'string') {
    const block = resolveTop(registry, top)
    return parseNode(registry, [{ name: block.name, args: '' }, input], block)
  }
  return parseNode(registry, input, typeof top === 'string' ? registry.resolve(top) as Block : top)
}

// can receive a string, a parsed HTML tag or a pre-parsed block description (match groups)
// pre-parsed tag needs to be parsed as a block
// post-parsed tag structure is arbitrary and not clear where it transitions to a block structure
// in the POST nesting case (there can be text inside that represents a block)
function parseNode(registry: Registry, ast: AST | Tag | TagL, parent?: Block): Tag {
  if (!isLeaf<Head | TagB, TagL>(ast)) {
    if (isTag(ast)) {
      return defrag(construct(value(ast), branch(ast).map(node => parseNode(registry, node, parent))))
    }
    else if (ast.length >= 2 && R.type(value(ast)) === 'Object' && R.all(x => R.type(x) === 'String', ast.slice(1))) {
      const block: Block = registry.resolve(value(ast).name) as Block
      if (!(block instanceof Block)) throw Error(`Something strange happened: ${block} is not a Block. while parsing\n${ast}`)
      const text: string = ast.slice(1).join('\n') as string
      const raw = (value(ast).args ?? '').trim()
      const opts: BlockOptions = parseArgs(raw ? raw.split(/\s+/) : [], block.opts as ArgMap) as BlockOptions
      switch (block.nest) {
        case Nesting.NONE:
          return defrag(block.parse(text, opts))
        case Nesting.POST: {
          const parsed = block.parse(text, opts)
          return defrag(construct(value(parsed), branch(parsed).map(node => parseNode(registry, node, block))))
        }
        case Nesting.SUB: {
          const { body, slots } = subprepare(registry, block, text, parent)
          const parsed = block.parse(body, opts)
          return defrag(splicehtmlmap(leaf => expandSlots(leaf, slots), parsed))
        }
        case Nesting.FRAME: {
          // FRAME: block wraps children but inherits inline subscriptions from the outer parent.
          const parsed = block.parse(text, opts)
          return defrag(construct(value(parsed), branch(parsed).map(node => parseNode(registry, node, parent ?? block))))
        }
      }
      throw Error(`Something went wrong. Nesting for block ${block} was not recognized as SUB, POST, NONE, or FRAME. while parsing:\n ${ast}`)
    }
    else {
      throw Error(`Something strange happened\n${ast}\nisn't a recognized format for parsing.`)
    }
  }
  else {
    if (!realQ(parent)) throw Error(`Something strange happened, you're trying to parse a string without a parent block context. ${parent}\n${ast}`)
    if (parent && parent.nest === Nesting.POST) {
      const p1 = splitblocks1(ast)
      if (!(p1.length === 1 && p1[0] === ast)) {
        return defrag([['<>', {}], ...p1.map(x => parseNode(registry, x, parent))])
      }
    }
    return [['<>', {}], ...parseinline(registry, parent, ast)]
  }
}
