import { describe, it, expect } from 'vitest'
import { parse } from '../parser'
import { render } from '../html'
import { StandardExtended } from '../library'

// In the browser, script.textContent has a leading \n before the first line
const introText = `
# Glue

*Glue* is an extensible markup language designed for the web. Unlike Markdown — which is
fixed and requires forking to add new syntax — Glue is built around a _Registry_: a
composable bag of inline and block elements you assemble to fit your document's needs.

---blockquote
"A plain-text format for other plain-text formats."
...

## How It Works

Inline elements look familiar: \`*bold*\`, \`_italic_\`, \`\` \`monospace\` \`\`, \`__underline__\`, \`~strike~\`.

Block elements use YAML document syntax:

---code
---blockquote
This text renders as a blockquote.
...
...

## This Page

This documentation page is itself a Glue document. Each section is a \`<script type="glue">\`
block parsed and rendered in the browser by the *glue.js* bundle.

To use Glue in your own page, add the bundle and call \`Glue.renderAll()\` on DOMContentLoaded:`

describe('intro section (with leading newline)', () => {
  it('parses without throwing', () => {
    expect(() => {
      const tag = parse(StandardExtended, [{ name: 'paragraphs', args: '' }, introText])
      render(tag)
    }).not.toThrow()
  })
})

describe('zero-content block (horizontal-rule repro)', () => {
  it('parses ---horizontal-rule without throwing', () => {
    const text = '\n## Horizontal Rule\n\n---horizontal-rule\n...\n'
    expect(() => {
      const tag = parse(StandardExtended, [{ name: 'paragraphs', args: '' }, text])
      render(tag)
    }).not.toThrow()
  })
})

const tourText = `
# Tour of the Standard Registry

The \`StandardExtended\` registry (used by default in \`renderAll\`) includes all elements below.

## Inline Elements

*Bold* \`*like this*\`. _Italic_ \`_like this_\`. \`Monospace\` \`\` \`like this\` \`\`.
__Underline__ \`__like this__\`. ~Strikethrough~ \`~like this~\`.

Superscripts: E = mc^{2}. Subscripts: H_{2}O.

Links: [Glue on GitHub](https://github.com/vshesh/gluejs).
Tooltips: T[hover over me](I am a tooltip).

## Headers

Six levels, same as Markdown — \`# H1\` through \`###### H6\`.

## Blockquote

---blockquote
Happiness is a warm codebase.
...

## Code

---code javascript
function greet(name) {
  return \`Hello, \${name}!\`
}
...

## Side by Side

Columns are separated by \`|\`. Each column is parsed independently.

---side-by-side
*Left column* with _inline_ markup.
| *Right column* — independent from the left.
...

## Lists

---unordered-list
- Unordered item one
- Unordered item two
- Unordered item three
...

---ordered-list
1. First step
2. Second step
3. Third step
...

## Horizontal Rule

---horizontal-rule
...

## CriticMarkup

{++Added text++}. {--Deleted text--}. {==Highlighted text==}.
{~~old~>new~~}. {>>This is a comment<<}.`

describe('tour section', () => {
  it('parses without throwing', () => {
    expect(() => {
      const tag = parse(StandardExtended, [{ name: 'paragraphs', args: '' }, tourText])
      render(tag)
    }).not.toThrow()
  })
})

const anatomyText = `
# Anatomy of an Element

Every element in a Registry is either a _Block_ or an _Inline_.

## Inline Elements

An inline element wraps a span of text. The simplest kind uses \`IdenticalInline\`:

---code typescript
import { IdenticalInline } from 'gluejs'

export const Bold = IdenticalInline('bold', '*', 'strong')
export const Italic = IdenticalInline('italic', '_', 'em')
...

For full control, use the \`inline\` factory:

---code typescript
import { inline, Nesting } from 'gluejs'

export const Bold = inline(
  /(?<!\\\\)\\*(.+?)(?<!\\\\)\\*/,
  function bold(groups) {
    return [['strong', {}], groups[0]]
  },
  Nesting.FRAME
)
...

## Block Elements

A block processes text between \`---name\` and \`...\`. Use the \`block\` decorator:

---code typescript
import { block, Nesting } from 'gluejs'

export const Blockquote = block(Nesting.POST)(function blockquote(text) {
  return [['blockquote', {}], text]
})
...

\`Nesting.POST\` parses inline elements inside the block after the block runs.
\`Nesting.NONE\` is for terminal elements (code, math) — content is verbatim.
\`Nesting.SUB\` pre-parses sub-blocks before the block sees the text.

## Registries

Compose elements into a Registry and parse:

---code typescript
import { Registry, parse, render } from 'gluejs'
import { Bold, Italic, Paragraphs } from 'gluejs/library'

const reg = new Registry().add(Bold, Italic, Paragraphs)
const html = render(parse(reg, [{ name: 'paragraphs', args: '' }, text]))
...`

describe('anatomy section', () => {
  it('parses without throwing', () => {
    expect(() => {
      const tag = parse(StandardExtended, [{ name: 'paragraphs', args: '' }, anatomyText])
      render(tag)
    }).not.toThrow()
  })
})

const apiText = `
# API Reference

## parse(registry, ast)

Parses a Glue AST node. For a full document, pass a two-element array:

---code typescript
const tag = parse(registry, [{ name: 'paragraphs', args: '' }, documentText])
...

## render(tag)

Converts a parsed \`Tag\` tree to an HTML string.

---code typescript
const html = render(tag)  // '<div class="paragraphs"><p>...</p></div>'
...

## Glue.renderAll(options?)

Browser-only. Finds \`<script type="glue">\` elements and renders them in place.

---code typescript
Glue.renderAll({
  registry: Glue.Standard,          // default: StandardExtended
  top: 'paragraphs',                // default: 'paragraphs'
  selector: 'script[type="glue"]',  // default
})
...

## Registries

---side-by-side
\`Standard\`

Bold, Italic, Monospace, Underline, Strikethrough, Superscript, Subscript,
Link, InlineImage, FullImage, Tooltip, Header, Paragraphs, Blockquote,
Code, HorizontalRule, SideBySide.
| \`StandardExtended\`

Everything in \`Standard\`, plus CriticMarkup (CriticAdd, CriticDel,
CriticHighlight, CriticComment, CriticSub), UnorderedList, OrderedList.

## Element Helpers

\`IdenticalInline(name, delim, tag)\` — symmetric inline like \`*bold*\`.

\`MirrorInline(name, open, tag)\` — mirrored inline like \`{++ins++}\`.

\`SingleGroupInline(name, open, close, tag)\` — asymmetric inline like \`^{sup}\`.

\`block(nest?, sub?)(fn)\` — decorator for block elements.

\`inline(regex, fn, nest?, escape?, sub?, display?)\` — factory for inline elements.

\`link(prefix, nest?)(fn)\` — factory for \`PREFIX[text](url)\` patterns.`

describe('api section', () => {
  it('parses without throwing', () => {
    expect(() => {
      const tag = parse(StandardExtended, [{ name: 'paragraphs', args: '' }, apiText])
      render(tag)
    }).not.toThrow()
  })
})
