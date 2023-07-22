import { Registry, IdenticalInline, block, Inline, Block, Nesting, parseinline } from './elements';

const DivBlock: Block = block(Nesting.POST)(function DivBlock(text:string) {return ['div', text]});
const Italic: Inline = IdenticalInline('bold', '_', 'em');
const Bold: Inline = IdenticalInline('italic', '*', 'strong')

function logElement(e: Block) {
  console.log(typeof e, e instanceof Block)
  return console.log(`Block(name='${e.name}', nesting=${e.nest}, sub=${e.sub})`) 
}

const r = new Registry().add(DivBlock, Italic, Bold)
console.log(r.inline_subscriptions(['all']))
console.log(parseinline(r, DivBlock, 'test *strong* test'))

