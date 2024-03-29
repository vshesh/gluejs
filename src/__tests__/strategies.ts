import * as fc from 'fast-check'
import { Tag, Registry, IdenticalInline, block, Inline, Block, Nesting, terminal_block, parseinline, BlockOptions, parse} from '../index'
import * as R from 'ramda'

export const zip = (...arrays: any[][]) => arrays[0].map((_:unknown, i:number) => arrays.map((arr) => arr[i]))

/** ------------------------------------------------------------------------- */
/** ------------------------------- Fixed examples -------------------------- */
/** ------------------------------------------------------------------------- */

export const Italic: Inline = IdenticalInline('italic', '_', 'em')
export const Bold: Inline = IdenticalInline('bold', '*', 'strong')

export const Paragraphs: Block = block(Nesting.SUB)(function Paragraphs(text:string) {
  return [['div.paragraphs', {}], ...text.split('\n\n').map((x) => (x.trim().startsWith('[|')? x : ([['p', {}], x ] as Tag)) )]
})

export const SideBySide = block(Nesting.POST)(function SideBySide(text: string, opts?: BlockOptions) {
  let cols = ((x) => { return R.map((col: string) => [['div', {style: {flex: '1'}}], col] as Tag)(R.map<string[], string>($ => $.join('\n'))(zip(...x))) })(R.map<string, string[]>($1 => $1.split('|'))(text.split('\n')))
  return [['div.side-by-side', {style: {display: 'flex'}}], ...cols]
})

export const Quote = block()(function Quote(text: string, opts?: BlockOptions) {
  return [['quote', {}], text]
})

export const Katex: Block = terminal_block()(function Katex(text: string, opts?: BlockOptions) {
  return [['div.katex', {}], text]
})

/** ------------------------------------------------------------------------- */
/** ---------------------- Parameterized strategies -------------------------- */
/** ------------------------------------------------------------------------- */
