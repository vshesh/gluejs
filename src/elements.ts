import {Tag} from "./parser"
import {makename, format, translate, escape} from "./util"
import * as R from 'ramda'
import XRegExp from 'XRegExp'

const regex = XRegExp
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
export type BlockOptions = {[ss:string]: number | string | boolean | ((e:unknown) => boolean)}
export type Parser = (text: string, o?: BlockOptions, ...args:string[]) => Tag
export type InlineParser = (groups: string[], o?: BlockOptions) => Tag

/*
Basic Element class, more or less a named tuple with some convenience functions. 
*/
export class Element { 
  readonly name: string; 
  assets: string[];
  constructor(parse: (...args: any[]) => Tag, public nest: Nesting, public subElements: SubElement[]) {
    this.name = makename(parse.name)
    this.assets = []
  }

  sub<T extends Element>(clazz: abstract new (...args: any) => T) { 
    return this.subElements.filter((x): x is T => x instanceof clazz || x === 'all' || x === 'inherit') 
  }
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
    this.regex = pattern instanceof RegExp ? pattern : regex(pattern)
    this.escape = escape 
    this.display = display
  } 

  validate() { 
    const pattern = this.regex.toString().slice(1,-1)
    return !(this.display === Display.BLOCK && !(pattern.startsWith('^') && pattern.endsWith('$')))
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
      return (p: Parser) => block(p, two, three, four)
    }
    if (typeof(one) !== 'function') { 
      return (p: Parser) => block(p, one, two, three)
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
  if (a instanceof RegExp && R.type(b) === 'Function') return new Inline(a, b, c, d, e, f)
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
  return (p: Parser) => block(p, Nesting.NONE, [], opts)
}

/**
  Quick and dirty unique ID. I don't need super cryptographic security, just something
  that isn't going to be the same every time it's called to beat caching algorithms 
  in most frontend rendering libraries. 
*/
const unique_id = () => { return Date.now().toString(36) + Math.random().toString(36).substring(2); }

export function standalone_integration(outer_elem='div', inner_elem='div') {

  return function standalone_integration_wrapper(f: (text: string, docid: string, elem: string, opts?: BlockOptions) => Tag) {
    const docid = makename(f.name) + '-' + unique_id()
    const elem = `document.getElementById(${docid})`

    function standalone_block(text:string, opts?: BlockOptions): Tag {
      return [[outer_elem + '.' + makename(f.name), {}],
        [[inner_elem + `#${docid}`, {key: docid+'-container'}]],
        [['script', {key: docid}], f(text, docid, elem, opts)]]
    }

    return terminal_block()(standalone_block)
  }
}


/* 
------------------------------ INLINE HELPERS -------------------------------------------------
*/



/** capitalized so it looks like a class. this is an enum with string value instead of int */ 
export const Patterns = {
  escape : r`(?<!\\)(?:\\\\)*{0}`,
  single_group : r`(?<!\\)(?:\\\\)*{0}(.*?(?<!\\)(?:\\\\)*){1}`,
  link : r`(?<!\\)(?:\\\\)*{0}\[((?:(?:[^\[])|(?:\[.*?\]))*?(?<!\\)(?:\\\\)*)\]\(((?:\([^\)]*\)|[^)\n])*)\)`,
  double_group : r`(?<!\\)(?:\\\\)*\{0}(.*?(?<!\\)(?:\\\\)*){1}(.*?(?<!\\)(?:\\\\)*){2}`,
  // matches structures like <ident.class.class2:text> useful for one line html tag formats.
  tag_simple : r`(?<!\\)(?:\\\\)*<([a-zA-Z][a-zA-Z0-9_-]*)((?:\.[a-zA-Z][a-zA-Z0-9_-]*)*):\s*([^>]+)>`,
  tag_attributes : r`(?<!\\)(?:\\\\)*<([a-zA-Z][a-zA-Z0-9_-]*)((?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)(?:\s+([a-zA-Z]+)=("[^"]+"))+:\s*([^>]+)>`,
}

export function inline_one(start: string, end: string, nest=Nesting.FRAME, sub=undefined, display=Display.INLINE) { 
  const p = Patterns.single_group.replace('{0}', start).replace('{1}', end)
  const patt = new RegExp(p);
  return (p: InlineParser) => inline(patt, p, nest, start.slice(0,1) + end.slice(0,1), sub, display)
}

type Attrs = {[s: string]: string}
export function SingleGroupInline(name: string, start: string, end: string, tag: string, attr: Attrs= {}) {
  const obj = {
    [name](body: string[]): Tag {
      return [[tag, attr], ...body]
    }
  }
  return inline_one(escape(start), escape(end))(obj[name])
}

export function IdenticalInline(name: string, s: string, tag: string, attr: Attrs={}) {
  return SingleGroupInline(name, s, s, tag, attr)
}

export function MirrorInline(name: string, start: string, tag: string, attr: Attrs={}) { 
  return SingleGroupInline(name, start, translate('()[]{}<>', ')(][}{><')(R.reverse(start)), tag, attr)
}

export function link(designation: string, nest:Nesting=Nesting.POST, sub?:SubElement[]) {
  const pattern = regex(Patterns.link.replace('{0}', designation));
  return (p:InlineParser) => inline(pattern, p, nest, "()[]"+(designation[0] ?? ''), sub)
}

export function inline_two(start: string, mid: string, end: string, nest:Nesting=Nesting.POST, sub:SubElement[]=['all']) {
  const pattern = regex( format(Patterns.double_group, start, mid, end))
  return inline(pattern, nest, '', sub)
}

