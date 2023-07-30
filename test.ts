import { Registry, IdenticalInline, block, Inline, Block, Nesting, terminal_block,parseinline, BlockOptions, parse, example,
  forestify, forestify_, forestify1, splitblocks, splitblocks1 } from './elements'
import * as R from 'ramda';

const Paragraphs: Block = block(Nesting.SUB)(function Paragraphs(text:string) {
  return [['div.paragraphs', {}], text.split('\n\n').map((x) => (x.trim().startsWith('[|'))? x : [['p', {}], x ] ) ]
});
const Italic: Inline = IdenticalInline('italic', '_', 'em');
const Bold: Inline = IdenticalInline('bold', '*', 'strong')

const zip = (...arrays: any[][]) => arrays[0].map((_:unknown, i:number) => arrays.map((arr) => arr[i]))

const SideBySide = block(Nesting.POST)(function SideBySide(text: string[], opts?: BlockOptions) {
  let cols = R.map((col) => [['div', {style: {flex: 1}}], col])(R.map($ => $.join('\n'))(((x) => zip(...x))(R.map($1 => $1.split('|'))(text.split('\n')))))
  console.log('cols', cols)
  return [['div.side-by-side', {style: {display: 'flex'}}], ...cols]
});

const Katex: Block = terminal_block()(function Katex(text: string, opts?: BlockOptions) {
  return [['div.katex', {}], text]
})

function logElement(e: Block) {
  console.log(typeof e, e instanceof Block)
  return console.log(`Block(name='${e.name}', nesting=${e.nest}, sub=${e.sub})`) 
}

const r = new Registry().add(Paragraphs, Italic, Bold, SideBySide, Katex)
// console.log(r.inline_subscriptions(['all']))
// console.log(parseinline(r, Paragraphs, 'test *strong* test'))

console.log(parse(r, [{name: 'paragraphs'}, example]))