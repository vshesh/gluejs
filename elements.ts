import XRegExp from 'XRegExp'
import getopts from "getopts" 
import * as R from "ramda";
import {format} from './util';

// I will make mistakes when transcribing from python... 
type str = string
const r = String.raw 
const regex = XRegExp 

// ramda has a function with proper ts types for this
// Object.defineProperty(String.prototype, 'reverse', {
//   value: function () {return this.split('').reverse().join('')}
// })

// akin to python str.translate
function translate(from: string, to: string) {
    const translate = (c: string) => { 
      const i = from.indexOf(c)
      return i >= 0 ? to[i] : i 
    };
    return (s:string) => s.split('').map(translate).join('')
}

function num_groups(regex:RegExp): number {
  return ((new RegExp(regex.toString() + '|')).exec('') || []).length - 1;
}

function escape(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
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

const makename = (name: string) => { 
  return name.replace(/([a-z])([A-Z])/g, (_, l, u) => `${l}-${u.toString().toLowerCase()}`).toLowerCase()
} 


// const makename = _.kebabCase 

type HTMLAttrs    = {[s:string]: string | number | boolean | {[_:string]: string | number | boolean}}
type HTMLChildren<S> = string | number | boolean | S
type Tag = [string, ...HTMLChildren<Tag>[]] | [string, HTMLAttrs, ...HTMLChildren<Tag>[]]
type HTML = {
  tag: string,
  attrs?: HTMLAttrs,
  children: HTMLChildren<HTML>[]
}
type SubElement = Element | 'all' | 'inherit';
// i can't remember why i thought i needed (e) => boolean (predicate) as an option.
export type BlockOptions = {[ss:string]: number | string | boolean | ((e:unknown) => boolean)}
export type Parser = (text: string, o?: BlockOptions, ...args:string[]) => Tag2
export type InlineParser = (groups: string[], o?: BlockOptions) => Tag2

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
    return this.subElements.filter((x): x is T => x instanceof clazz) 
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
// in that case attributes would also be parsed for example.
// this would be a good use case for julia multiple dispatch 
// parse(

/*
Unlike python, javascript does not have keyword args. 
That makes the design of the libraries I'm using a little cumbersome to use. 

I either have to do 
```js
new Block(Nesting.POST, ['all'], {}, function (text, opts) {

})
```
which is more js like, but then I cannot have good defaults (as you 
have to specify all positional arguments before the function), or I have to do 
```
new Block(function (text, opts) {
  
}, Nesting.POST, ['all'], {})
```

In python I could be more clever and seperate the two kinds of data with 
function syntax. This looks much cleaner.
```python
@block(Nesting.POST, ['all'], "lskdjfc:")
def BlockName(text: str, opts: Mapping[str, str]):
  ...
```


The closest I could get in JS is to wrap a class: 
```ts
@block(Nesting.POST, ['all'], {l: 1, s: true, ...})
class BlockName {
  parse(text: str, opts: BlockOptions): Tag {
    // do something
  }
}
```
Ok I guess there is one more option
```
block()(function (text, opts) {

})
```
While this is not very js like it does have the benefit of letting you overload 
things where you want to overload them.
I'm probably overthinking this as no one is going to use this library but me anyway

The correct thing in JS would be 

new Block({
  name: 
})

But this is incorrect! `BlockName` should be an *instance* of `Block`, 
not a subclass of block. :( I could hack an instance of Block in 
place of that class. That's about the best I can hope for, I think. 

The main reason this works in python is that a `Callable` class is 
conflatable with a method (it's just a function with some parameters). 
In Javascript it isn't as easy to make this change. 

If I chose to implement Blocks and Inlines as functions with extra 
parameters (in other words have element extend function) this is called a 
Hybrid Type and is deprecated in Typescript. It's also cumbersome to set up 
because it requires writing and interface, function, and class to get typechecked, 
at which point the class syntax above starts to look preferable. 
It would also require everyone consuming the library in Typescript to also 
do the same set up. 

Probably the best solution is to rethink and write block as a series of 
behaviors... so: 

abstract class Block < Element 
  abstract parse(text: str, opts: BlockOptions={}): Tag
  abstract get nest(): Nesting
  abstract get sub(): SubElement
  abstract get opts(): BlockOptions

But this is stupid. The other option is to forgo the class bs and 
"just use maps" clojure style. This may be the way to go. 

In that case 
const SomeBlock = terminal_block()(function (...) {

})

Still not the best syntax and makes it hard to check whether something is a Block or not. 
*/




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

  return function standalone_integration_wrapper(f: (text: string, docid: string, elem: string, opts?: BlockOptions) => Tag2) {
    const docid = makename(f.name) + '-' + unique_id()
    const elem = `document.getElementById(${docid})`

    function standalone_block(text:str, opts?: BlockOptions): Tag2 {
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
    [name](body: string[]): Tag2 {
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

/* ===========================================================================================
                                         PARSING FUNCTIONS 
=========================================================================================== */

function* splicehtmlmap<B,L>(f: (t:string) => (L | ArrayBranch<B, L>)[], html: ArrayBranch<B, L>): Generator<(L | ArrayBranch<B, L>), unknown, unknown> {
  yield R.head(html)
  const results=[];for (const e of R.tail(html)) { 
    if (e instanceof Array) {
      results.push(yield Array.from(splicehtmlmap(f, e)))
    }
    else if (typeof e === 'string') {
      results.push(yield f(e))
    }
    else { 
      results.push(yield e)
    }
  };return results;
} 

  
// this whole parsing situation needs to be made more functional 
// i don't like how many lines of code there are that I can't test in isolation.
// this is what happens when you write something in a couple weekends.

export function parseinline(registry: Registry, _element: Element | str, text: str, parent?:Element): (string | Tag2)[] {
  console.log('parseinline', _element, text)
  if (text === '') return []  

  const element : Element = registry.resolve(_element); 
  const subinline: Inline[] = registry.inline_subscriptions(element.sub(Inline), parent)
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
  let l: (string | Tag2)[] = []
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
        l.push(Array.from(splicehtmlmap((t) => parseinline(registry, element, t, parent), parser(groups))) as string | Tag2);break;
      }
      case Nesting.NONE: { 
        l.push(Array.from(parser(groups)));break;
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
        ), parser(groups) )));break;
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

  return l
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

function realQ<X>(x:X | null | undefined): x is X { 
  return x !== null && x !== undefined
} 

/**
TODO(vishesh): figure out how to extend the parser to work with 
any general shape of tree. 
That doesn't seem to be easy to do in js, or requires the use of 
more functional architecture than desired, 
such as here:  https://github.com/brucou/functional-rose-tree

right now i've implemented the functions for arraytrees which are 
one concrete implementation of a tree, you could implement it for 
any other type of tree you like. 
*/
type ArrayBranch<B, L> = [B, ...(L | ArrayBranch<B, L>)[]]
type ArrayTree<B, L> = L | ArrayBranch<B, L>
type ArrayForest<B, L> = ArrayTree<B, L>[]
// type ArrayTree<B, L> = L | [B, ...ArrayTree<B, L>[]] 
// ^ can't distinguish branch from leaf in this implementation so it doesn't typecheck properly

function isLeaf<B, L>(n: ArrayTree<B, L>): n is L  {return !(n instanceof Array)}
function value<B, L>(n: ArrayBranch<B,L>): B { return n[0] }
function construct<B, L>(b: B, branches: (L | ArrayBranch<B, L>)[]): ArrayBranch<B, L> { return [b, ...branches] }
function attach<B, L>(n: ArrayBranch<B, L>, branches: (L | ArrayBranch<B, L>)[]): ArrayBranch<B, L> { return [...n, ...branches]}
function branch<B, L>(n: L | ArrayBranch<B, L>): (L | ArrayBranch<B, L>)[] {
    if (isLeaf(n)) return []
    const [_, ...rest] = n 
    return rest 
}

// type HTMLAttrs    = {[s:string]: string | Map<string, string>}
// type HTMLChildren<S> = string | number | boolean | S
// type Tag = [{_tag_: string} & HTMLAttrs, ...HTMLChildren<Tag>[]]

type HTMLLeaf = string | number | boolean
type HTMLBranch = ArrayBranch<{_tag_: string} & HTMLAttrs, HTMLLeaf> 

// isLeaf works
// value is { n[0]._tag_ }
// construct(b, branches) = [{_tag_: b}, branches] 
// attach(n, branches) works 
// branch(n) works 

// Laws: given n: Branch
// construct(value(n), branch(n)) == n 
// isLeaf(attach(n, [n1, n2,...])) == false 
// isLeaf(construct(b, [n1, n2, ...])) == false 
// branch(l extends L) == []  (branch of a leaf is empty array)
// attach(construct(value(n), []), branch(n)) == n ([] can be replaced by any iterable)

// typeclasses are not a thing in JS
// Nestable<B, L> {
//   branch(n:Nestable<B, L>): Nestable<B, L>[]
//   attach(value: B, branches: Nestable<B, L>[]):  Nestable<B, L>[]
//   attach(n:Nestable<B,L>, branches: Nestable<B,L>[]): Nestable<B,L>[]
//   isLeaf(n:L | Nestable<B,L>): n is L
// }


/**
Converts an array of tokens some of which delimit the start and end of a block
into a array of trees (also called a "forest").
This uses non-tail recursion so it is not memory safe, 
but it was easy to write and should be fine because I do not expect
people to create a 100 nested deep file. Maximum I can imagine 4-5 nests. 

The consumer of this function should prepend the list with something that 
represents a Head of a tree if they want to parse further with tree-walk 
functions. (basically making a forest back into a tree again, by assigning
them all a common parent). 

start and end should produce a value from the token when it is valid and 
should produce undefined when not.
*/
export function forestify<H, T>(start: (t:T) => H | undefined, end: (t:T) => any, tokens: T[], pos: number=0): [ArrayTree<H, T>[], number] {
  let forest : ArrayTree<H,T>[] = [] 
  let i = pos
  while (i < tokens.length) {
    const token = tokens[i]
    const s = start(token) 
    if (s !== undefined) { 
      // an extra start will just consume input till the end of the file. 
      // It's not possible to know where the end got missed, only that it did.
      // This is a good way to gracefully degrade.
      let [subtree, endi] = forestify(start, end, tokens, i+1)
      // currently Forest<ArrayBranch<B, L>> = ArrayBranch<B, L>[] 
      forest.push(construct(s, subtree))
      i = endi
    } 
    else if (!!end(token)) {
      // an extra end will abort parsing early and cause the rest of the input to not be parsed.
      // again, it's a way to gracefully degrade.
      // the main `forestify` function will check for this case and append a string error message.
      return [forest, i+1]
    }
    else { 
      forest.push(token)
      i += 1
    }
  }
  return [forest, i]
}

/** 
  performs a 1-level tree construction, leaving lower strings intact. 
  it's as if we noticed the first level of the tree and left everything else alone.
  forestify will detect subtrees which may not be what you want. 

  techincally this function takes a third argument for how to combine T[]. 
  right now i assume string and join on '\n'. 
*/
export function forestify1<H, T>(start: (t:T) => H | undefined, end: (t:T) => any, tokens: T[], pos: number=0): ArrayTree<H, T>[] {
  let forest : ArrayTree<H,T>[] = [] 
  let i = pos
  let level = 0
  for (const token of tokens) {
    const s = start(token)
    if (s !== undefined) { 
      if (level == 0) forest.push([s]);
      else (forest[forest.length-1] as ArrayBranch<H,T>).push(token)
      level += 1
    }
    else if (!!end(token)) { 
      //forest[forest.length-1] = [value(forest[forest.length-1] as ArrayBranch<H, T>), forest[forest.length-1].slice(1).join('\n')]
      level -= 1
    }
    else { 
      if (level == 0) forest.push(token); 
      else (forest[forest.length-1] as ArrayBranch<H,T>).push(token)
    }
  }
  
  return forest
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


export function forestify_(start: string | RegExp, end: string | RegExp, tokens: string[], pos?:number) {
  const [tree, endi] = forestify<{[s:string]: string}, string>(check(start), check(end), tokens)
  if (endi >= tokens.length) { 
    return tree
  }
  else { 
    return [...tree, `Found an extra end token ${end} at position ${endi-1} in tokens: ${tokens}`]
  }
}


/**
more generic versions of postwalk and prewalk would take 
the branch and attach/construct functions as arguments.
or they would exist in a type system where you could specialize 
functions on types instead of only classes.
the reason being that you may want to only explore parts of the tree
or have different rules for building new trees based on what node you are on. 
this simple version works for my case. 
*/
function postwalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayTree<H, T>, tree: T): T
function postwalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayTree<H, T>, tree: ArrayBranch<H,T>): ArrayBranch<H, T>
function postwalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayBranch<H, T>, tree: ArrayTree<H,T>): ArrayTree<H, T>
function postwalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayBranch<H, T>, tree: ArrayTree<H,T>): ArrayTree<H, T> {
  // yield processed nodes in pre-walk order, transforming the *processed* child nodes, 
  // not the original node. Excludes leaf nodes (those require a ArrayTree => ArrayTree transformation)
  if (isLeaf(tree)) return tree 
  const branches = branch(tree).map((x) => postwalk(f, x))
  return f(construct(value(tree), branches))
}

function prewalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayTree<H, T>, tree: T): T
function prewalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayTree<H, T>, tree: ArrayBranch<H,T>): ArrayBranch<H, T>
function prewalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayTree<H, T>, tree: ArrayTree<H,T>): ArrayTree<H, T>
function prewalk<H, T>(f: (t: ArrayBranch<H, T>) => ArrayTree<H, T>, tree: ArrayTree<H,T>): ArrayTree<H, T> {
  if (isLeaf(tree)) return tree 
  let n = f(tree) 
  if (isLeaf(n)) return n
  const b = branch(n) // returns undefined if the branch is not to be explored.
  if (b) {
    return construct(value(n), b.map((t: ArrayTree<H, T>) => prewalk(f, t)))
  }
  return n
}

function prewalkL<B, L>(f: (t: L) => ArrayTree<B, L>, tree: L): ArrayTree<B, L>
function prewalkL<B, L>(f: (t: L) => ArrayTree<B, L>, tree: ArrayBranch<B,L>): ArrayBranch<B, L>
function prewalkL<B, L>(f: (t: L) => ArrayTree<B, L>, tree: ArrayTree<B,L>): ArrayTree<B, L>
function prewalkL<B, L>(f: (t: L) => ArrayTree<B, L>, tree: ArrayTree<B,L>): ArrayTree<B, L> {
  /**
  transforms leaf nodes while also traversing any tree that is created, if relevant. 
  */
  if (isLeaf(tree)) { 
    const subtree = f(tree) 
    if (isLeaf(subtree)) return subtree 
    // also recursively traverse the newly generated subtree. 
    return prewalkL(f, subtree)
  } 
  return construct(value(tree), branch(tree).map((t: ArrayTree<B, L>) => prewalkL(f, t)))
}


function concat<H>(f: (h:H) => string, t: ArrayTree<H, string>): string {
  if (isLeaf(t)) return t 
  return f(value(t)) + branch(t).map((st) => concat(f, st)).join('\n')
}

type Head = {[_:string]:string}
type AST = ArrayBranch<Head, string> 

export function splitblocks(text: string) { 
  return forestify_(/^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S.*)?$/, /^(?<dummy>\.\.\.\.*)\s*$/, text.split('\n'))
}

export function splitblocks1(text: string) {
  return forestify1(check(/^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S.*)?$/), check(/^(?<dummy>\.\.\.\.*)\s*$/), text.split(/\n+/))
}

type TagD = [string, HTMLAttrs]
type Tag2 = ArrayBranch<TagD, string>

// consider following example
// sidebyside is post block, katex is none and quote is a frame block.

function isTag2(x: any): x is Tag2 {
  const o = x[0]
  return o instanceof Array && R.type(o[0]) === 'String' && R.type(o[1]) === 'Object'
}

export function defrag(tree: Tag2) { 
  return construct(value(tree), R.chain<Tag2 | string, string | Tag2>((x) => !isLeaf(x) && value(x)[0] === '<>' ? branch(x) : [x], branch(tree)))
}

// can receive a string, a parsed HTML tag or a pre-parsed block description (match groups) 
// pre-parsed tag needs to be parsed as a block
// post-parsed tag structure is arbitrary and not clear where it transitions to a block structure 
// in the POST nesting case (there can be text inside that represents a block) 
export function parse(registry: Registry, ast: AST | Tag2 | string, parent?: Block): Tag2 {
  // where does parseinline go? POST and SUB together make this complicated 
  if (!isLeaf<Head | TagD, string>(ast)) { 
    // all attributes are ignored. when I add components, attributes need to be parsed for components as well. 
    if (isTag2(ast)) {
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
          return defrag(block.parse(text, opts ))
        }
        case Nesting.POST: { 
          const parsed = block.parse(text, opts)
          const final = construct(value(parsed), branch(parsed).map((node) => parse(registry, node, block)))
          console.log(final)
          return defrag(final)
        }
        case Nesting.SUB: { 
          const lexed = splitblocks1(text) 
          const subbed = lexed.map((node, i) => isLeaf(node) ? node : `[|${i}|]`).join('\n\n') //lexed.map((node) => isLeaf(node) ? parseinline(registry, block, node) : construct(value(node), branch(node).map((n) => continue))
          const parsed = block.parse(subbed, opts)
          return defrag(Array.from(splicehtmlmap((node: string) => !!node.match(/\[\|\d+\|\]/) ? parse(registry, lexed[parseInt(node.slice(2, -2))]) : node, parsed)))
        }
      }
    }
          // when Nesting.FRAME 
          //   // this case is equivalent to calling splitblocks inside the parser
          //   return block.parse(splitblocks(ast)) as unknown as Tag2
    else { 
      throw Error(`Something strange happened\n${ast}\nisn't a recognized format for parsing.`)
    }
  }
      // return construct<TagD, string>(value(ast), branch(ast).map((node) => parse(registry, tag <? Block ? tag : block, node)))
  else { 
    // isleaf (ast is a string) 
    // in the nesting.post case, this string can potentially contain a block. 
    // in all other cases, the string should just be parsed inline. 
    // regardless, there is no harm in attempting to detect a block and then dealing with the situation.
    if (!realQ(parent)) throw Error(`Something strange happened, you're trying to parse a string without a parent block context. ${parent}\n${ast}`)
    if (parent && parent.nest === Nesting.POST) { 
      // could have a sub block in the array, so two layers of fragments will be generated for each string.
      const p1 = splitblocks1(ast)
      const body = (p1.length > 1)? p1.map((x) => parse(registry, x, parent)) : parseinline(registry, parent, p1[0])
      return [['<>', {}],... body]
    }
    // otherwise there should be no blocks in the string: 
    return [['<>', {}], ...parseinline(registry, parent, ast)]
  }
}

