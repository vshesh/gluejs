import type {Tag} from "./parser"
import {makename, format, translate, escape} from "./util"
import * as R from 'ramda'

const r = String.raw 

/**
FRAME: element is intended to contain/frame the inside
       text, which means that subscriptions should be inherited from the parent.

POST: text in the block should be parsed AFTER this block is
      parsed. This is the default, and is suitable for most situations.

SUB: the inside of the text is parsed for child nodes (inline and
     block) first, and the corresponding sections are replaced with [|*|] style
     tags that are meant to be left UNTOUCHED. After this block is parsed,
     then the tags are replaced with the appropriate parsed sections. This could
     have also been called 'PRE', since it pre-parses the contents before
     calling the block's parsing function.

NONE: terminal element. The parser's output is taken verbatim, with out any
      further processing of its insides.
*/
export enum Nesting { FRAME, POST, SUB, NONE }

export enum Display { BLOCK, INLINE }

export enum AssetType {JS, CSS} 

export type SubElement = Element | 'all' | 'inherit';
// i can't remember why i thought i needed (e) => boolean (predicate) as an option.
export type BlockOptions = {[ss:string]: number | string | boolean | string[] | ((e:unknown) => boolean)}
export type Parser = (text: string, o?: BlockOptions, ...args:string[]) => Tag
export type InlineParser = (groups: string[], o?: BlockOptions) => Tag

/*
Basic Element class, more or less a named tuple with some convenience functions. 
*/
export class Element {
  readonly name: string;
  assets: string[];
  // IMPORTANT: The function passed to block()/inline() factory functions must use a camelCase
  // or lowercase name that differs from the outer const variable name. Bundlers (esbuild,
  // webpack) rename inner named function expressions to avoid shadowing outer variables, which
  // would corrupt the element name. Convention: outer = PascalCase, inner fn = camelCase.
  // e.g.  const MyBlock = block()(function myBlock(text) { ... })
  constructor(parse: (...args: any[]) => Tag, public nest: Nesting, public subElements: SubElement[]) {
    this.name = makename(parse.name)
    this.assets = []
  }

  sub<T extends Element>(clazz: abstract new (...args: any) => T) { 
    return this.subElements.filter((x): x is T => x instanceof clazz || x === 'all' || x === 'inherit') 
  }

  /** Shallow copy with overridden fields (python `_replace`). */
  with(props: Partial<this> & Record<string, unknown>): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, props)
  }

  validate(): boolean {
    if (this.nest === Nesting.NONE && this.subElements.length !== 0) return false
    return true
  }

  addAsset(asset: string) {
    this.assets.push(asset.trim())
    return this
  }
}

/** True when TS 5 / stage-3 called us as a class-field decorator. */
function isFieldCtx(ctx: unknown): ctx is ClassFieldDecoratorContext {
  return typeof ctx === 'object' && ctx !== null && (ctx as { kind?: string }).kind === 'field'
}

/**
 * Make a `(input) => output` factory also usable as a TS 5 field decorator.
 * `@dec() x = init` composes like python `@dec()` (inner decorator runs first).
 */
function fieldOrApply<I, O>(apply: (x: I) => O) {
  return ((value: I | undefined, ctx?: ClassFieldDecoratorContext) => {
    if (isFieldCtx(ctx)) return function (this: unknown, initial: I) { return apply(initial) }
    return apply(value as I)
  }) as (value: I) => O
}

/** TS 5 field decorator — python `@asset_url`. */
export function assetUrl(type: AssetType, url: string) {
  const tag = type === AssetType.JS
    ? `<script src="${url}"></script>`
    : `<link rel="stylesheet" href="${url}">`
  return <E extends Element>(_value: unknown, _ctx: ClassFieldDecoratorContext<unknown, E>) =>
    function (this: unknown, elem: E): E { return elem.addAsset(tag) }
}

/** TS 5 field decorator — python `@asset_inline`. */
export function assetInline(type: AssetType, contents: string) {
  const tag = type === AssetType.JS
    ? `<script>\n${contents}\n</script>`
    : `<style>\n${contents}\n</style>`
  return <E extends Element>(_value: unknown, _ctx: ClassFieldDecoratorContext<unknown, E>) =>
    function (this: unknown, elem: E): E { return elem.addAsset(tag) }
}



export class Block extends Element { 
  opts: BlockOptions
  constructor(public parse: Parser, 
    nest: Nesting=Nesting.POST, 
    sub: SubElement[]=['all'], 
    opts: BlockOptions={}) {
    super(parse, nest, sub)
    this.opts = opts
  }
}

export class Inline extends Element {
  regex: RegExp;
  display: Display;
  escape: string
  constructor(pattern: string | RegExp,
    // note, Inline parsers do not require options, so (s: string) => HTML is fine
    public parse: InlineParser, 
    nest: Nesting = Nesting.FRAME, 
    sub: SubElement[] = ['all'], 
    escape: string = '', 
    display: Display = Display.INLINE) {
    super(parse, nest, sub ?? ['all'])
    this.regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
    this.escape = escape
    this.display = display
  } 

  validate() { 
    const pattern = this.regex.source
    if (this.display === Display.BLOCK && !(pattern.startsWith('^') && pattern.endsWith('$'))) return false
    return super.validate()
  }
} 

// two more element sublcass might be BlockComponent and InlineComponent 
// in those cases attributes would also be parsed, and children are likely to not exist.

// todo(vshesh): how does one use this library with dynamic data without creating XSS attacks? 
// something to think about for later. 


/* 
Convenience function for making blocks, defines defaults and doesn't require `new Block(...)`
which leads to odd syntax in some places where I'm trying to be functional. */
export function block(parser: Parser, nest?:Nesting, sub?: SubElement[], opts?:BlockOptions): Block
export function block(parser: undefined, nest?: Nesting, sub?: SubElement[], opts?: BlockOptions): (p:Parser) => Block
export function block(nest?:Nesting, sub?: SubElement[], opts?:BlockOptions): (p:Parser) => Block
export function block(obj: {nest?:Nesting, sub?:SubElement[], opts?:BlockOptions, parser:Parser}): Block
export function block(obj: {nest?:Nesting, sub?:SubElement[], opts?:BlockOptions}): (p:Parser) => Block
export function block(one?:any, two?:any, three?:any, four?:BlockOptions): Block | ((p:Parser) => Block) {
  if (typeof(one) === 'object') { // R.type(one) === 'Object'
    return block(one.parser, one.nest, one.sub, one.opts)
  }
  else { 
    if (one == undefined) { 
      return fieldOrApply((p: Parser) => block(p, two, three, four) as Block)
    }
    if (typeof(one) !== 'function') { 
      return fieldOrApply((p: Parser) => block(p, one, two, three) as Block)
    }
    return new Block(one, two, three, four)
  }
}

/* 
Convenience function for making inlines, defines defaults and doesn't require `new Inline(...)`
which leads to odd syntax and unnecessary verbosity in some places where I'm trying to be functional. */
export function inline(regex: RegExp | string, parser: InlineParser, nest?:Nesting, escape?:string, sub?: SubElement[], display?:Display): Inline
export function inline(regex: RegExp, nest?: Nesting, escape?: string, sub?: SubElement[], display?: Display): (p:InlineParser) => Inline
export function inline(nest?:Nesting, escape?:string, sub?: SubElement[], display?:Display): (r: RegExp | string, p:InlineParser) => Inline
export function inline(obj: {nest?:Nesting, escape?: string, sub?:SubElement[], display?:Display, regex: RegExp | string, parser:InlineParser}): Inline
export function inline(obj: {nest?:Nesting, escape?: string, sub?:SubElement[], display?:Display, regex: RegExp | string}): (p:InlineParser) => Inline
export function inline(obj: {nest?:Nesting, escape?: string, sub?:SubElement[], display?:Display}): (r: RegExp | string, p:InlineParser) => Inline
// these two are purely to make the object version work generically, not intended to be used by others.
export function inline(regex: undefined, parser: undefined, nest?: Nesting, escape?: string, sub?: SubElement[], display?: Display): (r: RegExp | string, p:InlineParser) => Inline
export function inline(regex: RegExp, parser: undefined, nest?: Nesting, escape?: string, sub?: SubElement[], display?: Display): (p:InlineParser) => Inline
export function inline(a?: any, b?:any, c?:any, d?:any, e?:any, f?:Display): Inline | ((p: InlineParser) => Inline) | ((r: RegExp | string, p:InlineParser) => Inline) {
  if (R.type(a) === 'Object') return inline(a.regex, a.parser, a.nest, a.escape, a.sub, a.display)
  const isPatt = a instanceof RegExp || typeof a === 'string'
  if (isPatt && R.type(b) === 'Function') return new Inline(a, b, c, e, d, f)
  if (isPatt && b === undefined) return (p: InlineParser) => new Inline(a, p, c, e, d, f)
  if (a === undefined) return (regex: RegExp | string, p: InlineParser) => inline(regex, p)
  return (regex: RegExp | string, p: InlineParser) => inline(regex, p, a, b, c, d)
}



/* 
------------------------------ BLOCK HELPERS -------------------------------------------------
*/

/* 
A block that does it's own processing and does not have any sub-elements
Common example would be integrations with other plain text syntaxes, like KaTeX. */
export function terminal_block(opts: BlockOptions={}) {
  return fieldOrApply((p: Parser) => block(p, Nesting.NONE, [], opts) as Block)
}

/**
  Quick and dirty unique ID. I don't need super cryptographic security, just something
  that isn't going to be the same every time it's called to beat caching algorithms 
  in most frontend rendering libraries. 
*/
const unique_id = () => { return Date.now().toString(36) + Math.random().toString(36).substring(2); }

/** Python `@standalone_integration` — fn(text, docid, elem) → script body. */
export function standalone_integration(outer_elem='div', inner_elem='div') {
  return fieldOrApply((f: (text: string, docid: string, elem: string, opts?: BlockOptions) => string) => {
    const fname = makename(f.name)
    function standalone_block(text: string, opts?: BlockOptions): Tag {
      const docid = fname + '-' + unique_id()
      const elem = `document.getElementById('${docid}')`
      return [[outer_elem + '.' + fname, {}],
        [[inner_elem + `#${docid}`, {key: docid + '-container'}]],
        [['script', {key: docid}], f(text, docid, elem, opts)]]
    }
    Object.defineProperty(standalone_block, 'name', { value: f.name })
    return terminal_block()(standalone_block)
  })
}


/* 
------------------------------ INLINE HELPERS -------------------------------------------------
*/



/** capitalized so it looks like a class. this is an enum with string value instead of int */ 
/** Lookbehind `(?<=(?<!\\)(?:\\\\)*)` is the JS equivalent of python regex `\K` after an even number of backslashes. */
export const Patterns = {
  escape : r`(?<!\\)(?:\\\\)*{0}`,
  single_group : r`(?<=(?<!\\)(?:\\\\)*){0}(.*?(?<!\\)(?:\\\\)*){1}`,
  link : r`(?<=(?<!\\)(?:\\\\)*){0}\[((?:(?:[^\[])|(?:\[.*?\]))*?(?<!\\)(?:\\\\)*)\]\(((?:\([^\)]*\)|[^)\n])*)\)`,
  double_group : r`(?<=(?<!\\)(?:\\\\)*)\{0}(.*?(?<!\\)(?:\\\\)*){1}(.*?(?<!\\)(?:\\\\)*){2}`,
  // matches structures like <ident.class.class2:text> useful for one line html tag formats.
  tag_simple : r`(?<=(?<!\\)(?:\\\\)*)<([a-zA-Z][a-zA-Z0-9_-]*)((?:\.[a-zA-Z][a-zA-Z0-9_-]*)*):\s*([^>]+)>`,
  // attr blob as one group — JS regex keeps only the last of a repeated capture
  tag_attributes : r`(?<=(?<!\\)(?:\\\\)*)<([a-zA-Z][a-zA-Z0-9_-]*)((?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)((?:\s+[a-zA-Z]+="[^"]+")+):\s*([^>]+)>`,
}

export function inline_one(start: string, end: string, nest=Nesting.FRAME, sub=undefined, display=Display.INLINE) { 
  const p = Patterns.single_group.replace('{0}', escape(start)).replace('{1}', escape(end))
  const patt = new RegExp(p)
  return (p: InlineParser) => inline(patt, p, nest, start[0] + end[0], sub, display)
}

type Attrs = {[s: string]: string}
export function SingleGroupInline(name: string, start: string, end: string, tag: string, attr: Attrs= {}) {
  const obj = {
    [name](body: string[]): Tag {
      return [[tag, attr], ...body]
    }
  }
  return inline_one(start, end)(obj[name])
}

export function IdenticalInline(name: string, s: string, tag: string, attr: Attrs={}) {
  return SingleGroupInline(name, s, s, tag, attr)
}

export function MirrorInline(name: string, start: string, tag: string, attr: Attrs={}) { 
  return SingleGroupInline(name, start, translate('()[]{}<>', ')(][}{><')(R.reverse(start)), tag, attr)
}

export function link(designation: string, nest:Nesting=Nesting.POST, sub: SubElement[]=['inherit']) {
  const pattern = new RegExp(Patterns.link.replace('{0}', designation))
  return (p:InlineParser) => inline(pattern, p, nest, "()[]"+(designation[0] ?? ''), sub)
}

export function inline_two(start: string, mid: string, end: string, nest:Nesting=Nesting.POST, sub:SubElement[]=['inherit']) {
  const pattern = new RegExp(format(Patterns.double_group, start, mid, end))
  return inline(pattern, undefined, nest, '', sub)
}

