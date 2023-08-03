import {Parser, Tag, InlineParser, BlockOptions, Nesting, SubElement, Block, Inline, Element, Display} from "./parser"
import {makename, format, translate} from "./util"
import * as R from 'ramda'
import XRegExp from 'XRegExp'

const regex = XRegExp
const r = String.raw 

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

export function inline_one(start: string, end: string, nest=Nesting.FRAME, sub=undefined, display=Display.INLINE) { 
  const patt = new RegExp(Patterns.single_group.replace('{0}', start).replace('{1}', end));
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

