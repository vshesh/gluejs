import XRegExp from 'XRegExp'
import getopts from "getopts" 
import * as R from "ramda";
import {num_groups, makename} from './util';
import {ArrayBranch, ArrayTree, realQ, coalesce, value, isLeaf, construct, branch, forestify1, forestify_} from "./nestable"

// I will make mistakes when transcribing from python... 
type str = string
const regex = XRegExp 


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


type TagB = [string, HTMLAttrs]
type TagL = string | number | boolean
export type Tag = ArrayBranch<TagB, TagL>

type HTMLAttrs    = {[s:string]: TagL | {[_:string]: TagL }}
type HTMLChildren<S> = TagL | S
export type HTML = {
  tag: string,
  attrs?: HTMLAttrs,
  children: HTMLChildren<HTML>[]
}


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
    escape: str = '', 
    display: Display = Display.INLINE) {
    super(parse, nest, sub ?? ['all'])
    this.regex = pattern instanceof RegExp ? pattern : regex(pattern)
    this.escape = escape 
    this.display = display
  } 

  validate() { 
    const pattern = this.regex.toString().slice(1,-1)
    if (this.display === Display.BLOCK && !(pattern.startsWith('^') && pattern.endsWith('$'))) return false; 
    else return true
  }
} 

// two more element sublcass might be BlockComponent and InlineComponent 
// in those cases attributes would also be parsed, and children are likely to not exist.

// todo(vshesh): how does one use this library with dynamic data without creating XSS attacks? 
// something to think about for later. 


/* ==========================================================================================
                                       REGISTRY FUNCTIONS 
============================================================================================= */

export class Registry extends Map<string, Element> {
  constructor(...args: any[]) {
    super(...args)
  }
  
  add(...args:(Element | [string, Element])[]) {
    for (const a of args) { 
      if (a instanceof Element) { 
        this.set(a.name, a)
      }
      else {
        this.set(...a)
      }
    }
    return this
  }

  resolve(e: Element | string): Element { 
    if (e instanceof Element) { 
      return e
    } 
    else { // e <? String 
      let v = this.get(e)
      if (v === undefined) throw Error(`Element ${e} not found in registry ${this}`) 
      return v
    }
  }
  
  inlines() { 
    return Array.from(this.values()).filter( (x): x is Inline => x instanceof Inline)
  }

  blocks() { 
    return Array.from(this.values()).filter((x): x is Block => x instanceof Block)
  }

  assets() { 
    return Array.from(this.values()).map( (x) => x.assets.join('\n')).join('\n\n\n')
  }

  validate() { 
    return true
  }
    
  inline_subscriptions(names: (string | SubElement)[], parent?: Element): Inline[] {
    if (R.includes('all', names)) return this.inlines() 
    let l : Inline[] = []
    if (parent && 'inherit' in names) { 
      if (R.includes('all', parent.subElements)) return this.inlines() 
      let i = parent.sub(Inline)
      l.concat(parent.sub(Inline))
    }
    return []
  }
}

// this is just Object.assign(...), do I need a special function for this? 
export function union(r1: Registry, r2: Registry) { 
  return Object.assign({}, r1, r2)
}

export function diff(r1: Registry, r2: Registry) { 
  let o: Registry = new Registry()
  for (const k in r1) {
    if (!(k in r2) && r1.get(k) !== undefined) o.set(k, r1.get(k) as Block | Inline)
  }
  return o
} 

// ========================================================================================
// ========================================================================================
// ▀█▄   ▀█▀                        ▀██▀▀█▄                                         
//  █▀█   █    ▄▄▄▄  ▄▄▄ ▄▄▄ ▄▄▄     ██   ██  ▄▄▄▄   ▄▄▄ ▄▄   ▄▄▄▄    ▄▄▄▄  ▄▄▄ ▄▄  
//  █ ▀█▄ █  ▄█▄▄▄██  ██  ██  █      ██▄▄▄█▀ ▀▀ ▄██   ██▀ ▀▀ ██▄ ▀  ▄█▄▄▄██  ██▀ ▀▀ 
//  █   ███  ██        ███ ███       ██      ▄█▀ ██   ██     ▄ ▀█▄▄ ██       ██     
// ▄█▄   ▀█   ▀█▄▄▄▀    █   █       ▄██▄     ▀█▄▄▀█▀ ▄██▄    █▀▄▄█▀  ▀█▄▄▄▀ ▄██▄    
// ========================================================================================
// ========================================================================================


function* splicehtmlmap<B,L>(f: (t:string) => (L | ArrayBranch<B, L>)[], html: ArrayBranch<B, L>): Generator<(L | ArrayBranch<B, L>), unknown, unknown> {
  yield R.head(html)
  const results=[];for (const e of R.tail(html)) { 
    if (e instanceof Array) {
      // todo(vshesh): right now i have to defrag because i am creating frags in parse. Ideally I wouldn't do this. 
      results.push(yield defrag(Array.from(splicehtmlmap(f, e))))
    }
    else if (typeof e === 'string') {
      results.push(yield f(e))
    }
    else { 
      results.push(yield e)
    }
  };return results;
} 


export function defrag(tree: Tag): Tag {
  return coalesce((n: Tag) => value<TagB, TagL>(n)[0] === '<>', tree)
}


// this whole parsing situation needs to be made more functional 
// i don't like how many lines of code there are that I can't test in isolation.
// this is what happens when you write something in a couple weekends.

export function parseinline(registry: Registry, _element: Element | str, text: string, parent?:Element): (string | Tag)[] {
  if (text === '') return []  

  const element : Element = registry.resolve(_element); 
  const subinline: Inline[] = registry.inline_subscriptions(element.sub(Inline), parent)
  console.log("parseinline", text, parent, element.name, element.sub(Inline).length)
  if (subinline.length === 0) return [text] 

  const inlines : [RegExp, [InlineParser, Inline]][] = subinline.map( (x) => [x.regex, [x.parse, x]])
  let escapes = subinline
    .map((x) => x.escape.split(''))
    .reduce(R.union)
    .join('')
    .replace('[', '\\[').replace(']', '\\]')
  
  const unescape = escapes.length > 0 ? (t: string) => t.replace(regex(`\\\\([${regex.escape(escapes)}])`), `$1`) : R.identity;

  const patt: RegExp = ((x) => regex(x, 'sg'))(inlines
    .map((x) => `(?:${(typeof(x[0]) === 'string')? x[0] : x[0].source})`)
    .join('|'));

  const groupcursors: number[] = R.prepend(0)(((x) => x[1])(R.mapAccum((a:number,b:number) => [a+b, a+b], 0)(R.map((x: Inline) => num_groups(x.regex))(subinline))))

  // todo(vishesh)
  // ^ all of this is just setup that is specific to the element being parsed. 
  // one could imagine in the future that the registry just memoizes this computation 
  // and returns the patterns and cursors for each element. Most of them will be `all`,
  // or inherit from `all`, saving a lot of compiling.
  // also this function will look cleaner.
  
  const matches = text.matchAll(patt)
  let ind = 0
  let l: (string | Tag)[] = []
  for (const match of matches) { 
    // console.log(
    //   `Found ${match[0]} start=${match.index} end=${
    //     match.index + match[0].length
    //   }.`,
    // )
    const start = match.index
    const end = match.index + match[0].length
    // contains capture groups from all matches, even ones that didn't match. 
    const allgroups = Array.from<string>(match).slice(1)
    // first index in all groups that has a value 
    const groupind = R.findIndex((x) => x !== undefined)(allgroups)
    // convert to index of the matched element's pattern
    const pattind = R.findIndex((x) => x >= groupind, groupcursors);
    // console.log(allgroups, groupind, pattind)
    const [parser, elem] = inlines[pattind][1]
    // todo ^ this kind of stuff is unnecessary. can just do inlines[pattind]{parser, elem}

    // groups of the matching pattern
    const groups = R.slice(groupcursors[pattind], groupcursors[pattind+1] ?? Infinity, allgroups)

    // all text before this match
    l.push(R.slice(ind, start, text))
    // set ind to end of this string, for the next match
    ind = end

    switch(elem.nest) { 
      case Nesting.FRAME: { 
        l.push(Array.from(splicehtmlmap((t) => parseinline(registry, element, t, parent), parser(groups))) as string | Tag);break;
      }
      case Nesting.NONE: { 
        l.push(parser(groups));break;
      }
      case Nesting.POST: { 
        // todo(vishesh) i need to rethink this. the python transliteration 
        // is putting inlines in place of blocks but then calls subinline on them
        // and i'm not sure how that's resolving. 
        // the clean implementation would be to parse a block of text for a list of 
        // acceptable inline elements instead of just one. 
        // then here we would use the registry to resolve what those acceptable styles are
        // moving the management of dependencies out of this function.
        l.push(Array.from(splicehtmlmap( (t) => parseinline(
          registry, 
          (R.includes('inherit', elem.sub(Inline)))? element : elem,
          t,
          (R.includes('inherit', elem.sub(Inline)))? parent : element
        ), parser(groups) ) ));break;
      }
      case Nesting.SUB: { 
        // this is meaningless for inline elements. 
        // they parse capture groups, not text directly. 
        l.push([['', {}], `why does your inline element ${elem} have nesting = Nesting.SUB?`]);break;
      }
    }
  }

  if (ind < text.length) { 
    l.push(text.slice(ind))
  } 

  console.log('returning', l)
  return l
}

type Head = {[_:string]:string}
type AST = ArrayBranch<Head, string> 

function check(test: string | RegExp): (value: string) => { [key: string]: string; } | undefined {
  return (function(value: string) {
    if (test instanceof RegExp) {
      return value.match(test)?.groups
    }
    else {
      return test === value ? {name: test} : undefined
    }
  })
}

export function splitblocks(text: string) { 
  return forestify_(/^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S[\w_=\- \.@$%*!#,]+)?$/, /^(?<dummy>\.\.\.\.*)\s*$/, text.split('\n'))
}

export function splitblocks1(text: string) {
  return forestify1(check(/^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S[\w_=\- \.@$%*!#,]+)?$/), check(/^(?<dummy>\.\.\.\.*)\s*$/), text.split(/\n+/))
}

function isTag(x: any): x is Tag {
  const o = x[0]
  return R.type(o) === 'String' || (o instanceof Array && o.length === 2 && R.type(o[0]) === 'String' && R.type(o[1]) === 'Object')
}


// can receive a string, a parsed HTML tag or a pre-parsed block description (match groups) 
// pre-parsed tag needs to be parsed as a block
// post-parsed tag structure is arbitrary and not clear where it transitions to a block structure 
// in the POST nesting case (there can be text inside that represents a block) 
export function parse(registry: Registry, ast: AST | Tag | string, parent?: Block): Tag {
  console.log('parse', parent, ast)
  // where does parseinline go? POST and SUB together make this complicated 
  if (!isLeaf<Head | TagB, string>(ast)) { 
    // all attributes are ignored. when I add components, attributes need to be parsed for components as well. 
    if (isTag(ast)) {
      // Nesting.POST case 
      // we evaluate the strings underneath inside the context of the current block
      return defrag(construct(value(ast), branch(ast).map((node) => parse(registry, node, parent))))
    }
    else if (ast.length >= 2 && R.all((x) => R.type(x) === 'String', ast.slice(1))) {
      // Nesting.SUB parent case, we are being given a block name and a series of strings. There should not be anything else
      const block = registry.resolve(value(ast).name);
      const text: string = ast.slice(1).join('\n') as string;
      const opts: BlockOptions = R.omit(['name'], value(ast))
      // the tag name should be a block but just check
      if (!(block instanceof Block)) throw Error(`Something strange happened: ${block} is not a Block. while parsing\n${ast}`)
      switch(block.nest) { 
        case Nesting.NONE: { 
          return defrag(block.parse(text, opts ));break;
        }
        case Nesting.POST: { 
          const parsed = block.parse(text, opts)
          const final = construct(value(parsed), branch(parsed).map((node) => parse(registry, node, block)))
          return defrag(final);break;
        }
        case Nesting.SUB: { 
          const lexed = splitblocks1(text) 
          const subbed = lexed.map((node, i) => isLeaf(node) ? node : `[|${i}|]`).join('\n\n') //lexed.map((node) => isLeaf(node) ? parseinline(registry, block, node) : construct(value(node), branch(node).map((n) => continue))
          const parsed = block.parse(subbed, opts)

          return defrag(Array.from(splicehtmlmap<[string, HTMLAttrs], HTMLChildren<Tag>>((node: string) => parse(registry, !!node.match(/\[\|\d+\|\]/) ? lexed[parseInt(node.slice(2, -2))] : node, block) , parsed)) as Tag);break;
        }
      }
          // when Nesting.FRAME 
          //   // this case is equivalent to calling splitblocks inside the parser
          //   return block.parse(splitblocks(ast)) as unknown as Tag
      throw Error(`Something went wrong. Nesting for block ${block} was not recognized as SUB, POST, or NONE. while parsing:\n ${ast}`)
    }
    else { 
      throw Error(`Something strange happened\n${ast}\nisn't a recognized format for parsing.`)
    }
  }
      // return construct<TagB, string>(value(ast), branch(ast).map((node) => parse(registry, tag <? Block ? tag : block, node)))
  else { 
    // isleaf (ast is a string) 
    // in the nesting.post case, this string can potentially contain a block. 
    // in all other cases, the string should just be parsed inline. 
    // regardless, there is no harm in attempting to detect a block and then dealing with the situation.
    if (!realQ(parent)) throw Error(`Something strange happened, you're trying to parse a string without a parent block context. ${parent}\n${ast}`)
    if (parent && parent.nest === Nesting.POST) { 
      // could have a sub block in the array, so two layers of fragments will be generated for each string.
      const p1 = splitblocks1(ast)
      if (!(p1.length === 1 && p1[0] === ast)) { 
        return defrag([['<>', {}],... p1.map((x) => parse(registry, x, parent))])
      }
    }
    // otherwise there should be no blocks in the string: 
    return [['<>', {}], ...parseinline(registry, parent, ast)]
  }
}

