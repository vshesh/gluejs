import { Registry, IdenticalInline, block, Inline, Block, Nesting, terminal_block, Tag, parseinline, BlockOptions, parse} from '../index'
import * as R from 'ramda'

const Paragraphs: Block = block(Nesting.SUB)(function Paragraphs(text:string) {
  return [['div.paragraphs', {}], ...text.split('\n\n').map((x) => (x.trim().startsWith('[|')? x : [['p', {}], x ]) )] as Tag
})

const Italic: Inline = IdenticalInline('italic', '_', 'em')
const Bold: Inline = IdenticalInline('bold', '*', 'strong')

const zip = (...arrays: any[][]) => arrays[0].map((_:unknown, i:number) => arrays.map((arr) => arr[i]))

const SideBySide = block(Nesting.POST)(function SideBySide(text: string, opts?: BlockOptions): Tag {
  let cols: Tag[] = R.map((col) => [['div', {style: {flex: 1}}], col] as Tag)(R.map<string[], string>($ => $.join('\n'))(((x) => zip(...x))(R.map<string, string[]>($1 => $1.split('|'))(text.split('\n')))))
  return [['div.side-by-side', {style: {display: 'flex'}}], ...cols] as Tag
})

const Quote = block()(function Quote(text: string, opts?: BlockOptions) {
  return [['quote', {}], text]
})

const Katex: Block = terminal_block()(function Katex(text: string, opts?: BlockOptions) {
  return [['div.katex', {}], text]
})

function logElement(e: Block) {
  console.log(typeof e, e instanceof Block)
  return console.log(`Block(name='${e.name}', nesting=${e.nest}, sub=${e.sub})`) 
}

const example = `Hello this is a *test* 

---katex
f(x) = 2x 
....

---side-by-side flex
---quote | another piece of text
 some _important_ thing | ![](https://lorem.pixel/200/200)
... | blah blah blah
...

Other *stuff* at the bottom here`

const simple = `
---quote 
Hello this is a *test*
...
`

const r = new Registry().add(Paragraphs, Italic, Bold, SideBySide, Katex, Quote)
// console.log(r.inline_subscriptions(['all']))
// console.log(parseinline(r, Paragraphs, 'test *strong* test'))
// console.log(r.inlines())

console.log(parse(r, [{name: 'paragraphs'}, example]))