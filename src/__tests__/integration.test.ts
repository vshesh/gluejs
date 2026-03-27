import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { Standard, StandardExtended, Paragraphs } from '../library'
import { render } from '../html'
import { parse } from '../index'
import type { Tag } from '../index'

// ---------------------------------------------------------------------------
// End-to-end integration tests
//
// These tests exercise the full parse→render pipeline with realistic
// multi-block documents representative of how glue is actually used.
// ---------------------------------------------------------------------------

// Parses a document string through the given registry's paragraphs block
function doc(text: string, registry = Standard) {
  return render(parse(registry, [{ name: 'paragraphs', args: '' }, text]))
}

// ---------------------------------------------------------------------------
// Realistic document fixtures
// ---------------------------------------------------------------------------

const SAMPLE_INTRO = `
# Introduction

Glue is a *plain-text* format for creating _other_ plain-text formats.

---blockquote
Use it for documentation, notebooks, and anywhere you need rich
content from simple text.
...

Here is some \`inline code\` and also [a link](https://example.com).
`.trim()

const SAMPLE_MIXED_BLOCKS = `
## Getting Started

Install with __npm install glue__.

---code
const reg = new Registry()
reg.add(Bold, Italic, Paragraphs)
...

---blockquote
This is a _quoted_ note with *emphasis*.
...

The ^{superscript} and _{subscript} elements work inside paragraphs.
`.trim()

const SAMPLE_EDITOR_DIFF = `
## Changelog

{++Added new feature++} and {--removed old one--}.

{==Highlighted section==} with a {>>comment here<<}.

{~~old text~>new text~~} shows a substitution.
`.trim()

// ---------------------------------------------------------------------------
// Full pipeline: parse + render produces expected HTML structure
// ---------------------------------------------------------------------------

describe('End-to-end: Standard registry', () => {
  it('intro document: headers, bold, italic, blockquote, inline code, link', () => {
    const html = doc(SAMPLE_INTRO)
    expect(html).toContain('<h1>')
    expect(html).toContain('<strong>plain-text</strong>')
    expect(html).toContain('<em>other</em>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<code>inline code</code>')
    expect(html).toContain('<a')
    expect(html).toContain('href="https://example.com"')
  })

  it('mixed-block document: h2, underline, code block, blockquote, super/subscript', () => {
    const html = doc(SAMPLE_MIXED_BLOCKS)
    expect(html).toContain('<h2>')
    expect(html).toContain('<u>npm install glue</u>')
    expect(html).toContain('<pre>')
    expect(html).toContain('<code>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<em>quoted</em>')
    expect(html).toContain('<strong>emphasis</strong>')
    expect(html).toContain('<sup>')
    expect(html).toContain('<sub>')
  })

  it('code block shields inner content from inline parsing', () => {
    const html = doc(SAMPLE_MIXED_BLOCKS)
    // The code block contains 'Bold, Italic' etc. — these should NOT be parsed
    const codeStart = html.indexOf('<code>')
    const codeEnd = html.indexOf('</code>', codeStart)
    const codeContent = html.slice(codeStart, codeEnd)
    expect(codeContent).not.toContain('<strong>')
    expect(codeContent).not.toContain('<em>')
  })
})

describe('End-to-end: StandardExtended registry (CriticMarkup)', () => {
  it('critic diff document: add, del, highlight, comment, substitution', () => {
    const html = doc(SAMPLE_EDITOR_DIFF, StandardExtended)
    expect(html).toContain('<ins>')
    expect(html).toContain('<del>')
    expect(html).toContain('<mark>')
    expect(html).toContain('critic')         // comment span has critic class
    expect(html).toContain('Added new feature')
    expect(html).toContain('removed old one')
    expect(html).toContain('Highlighted section')
    expect(html).toContain('old text')
    expect(html).toContain('new text')
  })
})

// ---------------------------------------------------------------------------
// Properties of the full system
// ---------------------------------------------------------------------------

describe('End-to-end properties', () => {
  it('property: parse+render is total — never throws on safe multi-block documents', () => {
    // Generate a document with a mix of block and inline syntax using safe content.
    const arbWord = fc.string().filter(s => /^[a-zA-Z]{3,8}$/.test(s))
    const arbSentence = fc.array(arbWord, { minLength: 2, maxLength: 6 }).map(ws => ws.join(' '))
    const arbBlock = fc.oneof(
      // plain paragraph
      arbSentence,
      // code block
      arbSentence.map(s => `---code\n${s}\n...`),
      // blockquote
      arbSentence.map(s => `---blockquote\n${s}\n...`),
    )

    fc.assert(fc.property(
      fc.array(arbBlock, { minLength: 1, maxLength: 5 }),
      (blocks) => {
        const text = blocks.join('\n\n')
        expect(() => doc(text)).not.toThrow()
      }
    ))
  })

  it('property: inline elements in blockquote output contain the original words', () => {
    fc.assert(fc.property(
      fc.string().filter(s => /^[a-zA-Z]{3,8}$/.test(s)),
      (arbWord) => {
        // A word wrapped in bold inside a blockquote must survive the full pipeline.
        const text = `---blockquote\n*${arbWord}*\n...`
        const html = doc(text)
        return html.includes(arbWord) && html.includes('<strong>')
      }
    ))
  })

  it('property: ordered list items appear in rendered output', () => {
    fc.assert(fc.property(
      fc.array(
        fc.string().filter(s => /^[a-zA-Z]{3,10}$/.test(s)),
        { minLength: 2, maxLength: 5 }
      ),
      (items) => {
        const listText = items.map((item, i) => `${i + 1}. ${item}`).join('\n')
        const text = `---ordered-list\n${listText}\n...`
        const html = doc(text, StandardExtended)
        return items.every(item => html.includes(item)) && html.includes('<ol>')
      }
    ))
  })
})
