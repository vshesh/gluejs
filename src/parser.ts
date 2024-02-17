import XRegExp from 'XRegExp'
import getopts from "getopts" 
import * as R from "ramda";
import {num_groups, makename} from './util';
import {ArrayBranch, ArrayTree, realQ, coalesce, value, isLeaf, transformleaves, construct, branch, forestify1, forestify_} from "./nestable"
import {Block, Inline, Element, Parser,Nesting, InlineParser, BlockOptions, SubElement} from "./elements"


// I will make mistakes when transcribing from python... 
type str = string
const regex = XRegExp 

type HTMLAttrs    = {[s:string]: string | number | boolean | {[_:string]: string | number | boolean }}
type HTMLChildren<S> = TagL | S
export type HTML = {
  tag: string,
  attrs?: HTMLAttrs,
  children: HTMLChildren<HTML>[]
}

type TagB = [string, HTMLAttrs]
type TagL = string // | number | boolean // not including these yet
export type Tag = ArrayBranch<TagB, TagL>


function isTag(x: any): x is Tag {
  const o = x[0]
  return R.type(o) === 'String' || (o instanceof Array && o.length === 2 && R.type(o[0]) === 'String' && R.type(o[1]) === 'Object')
}


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

export function splicehtmlmap(f: (t: TagL) => (TagL | Tag)[], html: Tag): Tag {
  return transformleaves(f, html, false)
}

export function defrag(tree: Tag): Tag {
  return coalesce((n: Tag) => value<TagB, TagL>(n)[0] === '<>', tree)
}


// this whole parsing situation needs to be made more functional 
// i don't like how many lines of code there are that I can't test in isolation.
// this is what happens when you write something in a couple weekends.

export function parseinline(registry: Registry, _element: Element | str, text: string, parent?:Element): (string | Tag)[] {
  if (text === '') return []  

  const element : Element = registry.resolve(_element) 
  const subinline: Inline[] = registry.inline_subscriptions(element.sub(Inline), parent)
  console.log("parseinline", text, parent, element.name, element.sub(Inline).length)
  if (subinline.length === 0) return [text] 

  const inlines : [RegExp, [InlineParser, Inline]][] = subinline.map( (x) => [x.regex, [x.parse, x]])
  let escapes = subinline
    .map((x) => x.escape.split(''))
    .reduce(R.union)
    .join('')
    .replace('[', '\\[').replace(']', '\\]')
  
  const unescape = escapes.length > 0 ? (t: string) => t.replace(regex(`\\\\([${regex.escape(escapes)}])`), `$1`) : R.identity

  const patt: RegExp = ((x) => regex(x, 'sg'))(inlines
    .map((x) => `(?:${(typeof(x[0]) === 'string'? x[0] : x[0].source)})`)
    .join('|'))

  const groupcursors: number[] = ((x) => { return R.prepend(0)(x[1]) })(R.mapAccum((a:number,b:number) => [a+b, a+b], 0)(R.map((x: Inline) => num_groups(x.regex))(subinline)))

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
    const start = match.index as number
    const end = start + match[0].length
    // contains capture groups from all matches, even ones that didn't match. 
    const allgroups = Array.from<string>(match).slice(1)
    // first index in all groups that has a value 
    const groupind = R.findIndex((x) => x !== undefined)(allgroups)
    // convert to index of the matched element's pattern
    const pattind = R.findIndex((x) => x >= groupind, groupcursors)
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
        const inheritQ = R.includes('inherit', elem.sub(Inline) as ("inherit" | Inline)[])
        l.push(splicehtmlmap( (t) => parseinline(
          registry, 
          (inheritQ? element : elem),
          t,
          (inheritQ? parent : element)
        ), parser(groups) ) );break;
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

  
export const BLOCK_START = /^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S[\w_=\- \.@$%*!#,]+)?$/
export const BLOCK_END = /^(?<dummy>\.\.\.\.*)\s*$/

export function splitblocks(text: string) { 
  return forestify_(BLOCK_START, BLOCK_END, text.split('\n'))
}

// The difference is that this will only split 1 level, not build a whole tree
export function splitblocks1(text: string) {
  return forestify1(check(BLOCK_START), check(BLOCK_END), text.split(/\n+/))
}


type Head = {[_:string]:string}
type AST = ArrayBranch<Head, string> 

// can receive a string, a parsed HTML tag or a pre-parsed block description (match groups) 
// pre-parsed tag needs to be parsed as a block
// post-parsed tag structure is arbitrary and not clear where it transitions to a block structure 
// in the POST nesting case (there can be text inside that represents a block) 
export function parse(registry: Registry, ast: AST | Tag | TagL, parent?: Block): Tag {
  console.log('parse', parent, ast)
  // where does parseinline go? POST and SUB together make this complicated 
  if (!isLeaf<Head | TagB, TagL>(ast)) { 
    // all attributes are ignored. when I add components, attributes need to be parsed for components as well. 
    if (isTag(ast)) {
      // Nesting.POST case 
      // we evaluate the strings underneath inside the context of the current block
      return defrag(construct(value(ast), branch(ast).map((node) => parse(registry, node, parent))))
    }
    else if (ast.length >= 2 && R.all((x) => R.type(x) === 'String', ast.slice(1))) {
      // Nesting.SUB parent case, we are being given a block name and a series of strings. There should not be anything else
      const block: Block = registry.resolve(value(ast).name) as Block
      if (!(block instanceof Block)) throw Error(`Something strange happened: ${block} is not a Block. while parsing\n${ast}`)
      const text: string = ast.slice(1).join('\n') as string
      const opts: BlockOptions = getopts(value(ast).args.split(' ')) // , block.opts)  // <- todo: add this back in when ready
      // the tag name should be a block but just check
      switch(block.nest) { 
        case Nesting.NONE: { 
          return defrag(block.parse(text, opts ))
        }
        case Nesting.POST: { 
          const parsed = block.parse(text, opts)
          const final = construct(value(parsed), branch(parsed).map((node) => parse(registry, node, block)))
          return defrag(final)
        }
        case Nesting.SUB: { 
          const lexed = splitblocks1(text) 
          const subbed = lexed.map((node, i) => isLeaf(node) ? node : `[|${i}|]`).join('\n\n') 
          // can also distinguish inline vs block if necessary
          //subbed := lexed.map((node) => isLeaf(node) ? parseinline(registry, block, node) : construct(value(node), branch(node).map((n) => continue))
          const parsed = block.parse(subbed, opts)

          return defrag(Array.from(splicehtmlmap((node: string) => [parse(registry, !!node.match(/\[\|\d+\|\]/) ? lexed[parseInt(node.slice(2, -2))] : node, block)] , parsed)) as Tag)
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

