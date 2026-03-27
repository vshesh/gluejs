import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  Bold, Italic, Monospace, Underline, Strikethrough,
  Superscript, Subscript, Link, InlineImage, Tooltip,
  Header, Blockquote, Code, SideBySide, HorizontalRule, Paragraphs,
  StandardInline, Standard,
} from '../library'
import { render } from '../html'
import { parse, parseinline, Registry } from '../index'
import type { Tag } from '../index'

// ---------------------------------------------------------------------------
// Inline elements — basic
// ---------------------------------------------------------------------------

describe('Bold', () => {
  it('has name "bold"', () => expect(Bold.name).toBe('bold'))

  it('wraps content in <strong>', () => {
    const reg = new Registry().add(Paragraphs, Bold)
    const result = parseinline(reg, Paragraphs, '*hello*')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<strong>hello</strong>')
  })
})

describe('Italic', () => {
  it('has name "italic"', () => expect(Italic.name).toBe('italic'))

  it('wraps content in <em>', () => {
    const reg = new Registry().add(Paragraphs, Italic)
    const result = parseinline(reg, Paragraphs, '_hello_')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<em>hello</em>')
  })
})

describe('Monospace', () => {
  it('has name "monospace"', () => expect(Monospace.name).toBe('monospace'))

  it('wraps content in <code>', () => {
    const reg = new Registry().add(Paragraphs, Monospace)
    const result = parseinline(reg, Paragraphs, '`hello`')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<code>hello</code>')
  })
})

describe('Underline', () => {
  it('has name "underline"', () => expect(Underline.name).toBe('underline'))

  it('wraps content in <u>', () => {
    const reg = new Registry().add(Paragraphs, Underline)
    const result = parseinline(reg, Paragraphs, '__hello__')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<u>hello</u>')
  })
})

describe('Strikethrough', () => {
  it('has name "strikethrough"', () => expect(Strikethrough.name).toBe('strikethrough'))

  it('wraps content in <del>', () => {
    const reg = new Registry().add(Paragraphs, Strikethrough)
    const result = parseinline(reg, Paragraphs, '~hello~')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<del>hello</del>')
  })
})

describe('Superscript', () => {
  it('has name "superscript"', () => expect(Superscript.name).toBe('superscript'))

  it('wraps content in <sup>', () => {
    const reg = new Registry().add(Paragraphs, Superscript)
    const result = parseinline(reg, Paragraphs, '^{hello}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<sup>hello</sup>')
  })
})

describe('Subscript', () => {
  it('has name "subscript"', () => expect(Subscript.name).toBe('subscript'))

  it('wraps content in <sub>', () => {
    const reg = new Registry().add(Paragraphs, Subscript)
    const result = parseinline(reg, Paragraphs, '_{hello}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<sub>hello</sub>')
  })
})

describe('Link', () => {
  it('has name "link"', () => expect(Link.name).toBe('link'))

  it('renders as <a> with href', () => {
    const reg = new Registry().add(Paragraphs, Link)
    const result = parseinline(reg, Paragraphs, '[click here](https://example.com)')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<a')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('click here')
  })
})

describe('InlineImage', () => {
  it('has name "inline-image"', () => expect(InlineImage.name).toBe('inline-image'))

  it('renders as <img> with src and alt', () => {
    const reg = new Registry().add(Paragraphs, InlineImage)
    const result = parseinline(reg, Paragraphs, '![alt text](image.png)')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<img')
    expect(html).toContain('src="image.png"')
    expect(html).toContain('alt="alt text"')
  })
})

describe('Tooltip', () => {
  it('has name "tooltip"', () => expect(Tooltip.name).toBe('tooltip'))

  it('renders as <span> with title', () => {
    const reg = new Registry().add(Paragraphs, Tooltip)
    const result = parseinline(reg, Paragraphs, 'T[hover text](tooltip text)')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<span')
    expect(html).toContain('title="tooltip text"')
    expect(html).toContain('hover text')
  })
})

// ---------------------------------------------------------------------------
// Block elements
// ---------------------------------------------------------------------------

describe('Header', () => {
  it('has name "header"', () => expect(Header.name).toBe('header'))

  // Header is a Display.BLOCK inline, so it must be invoked via parseinline or parse with a parent block
  it('# text renders as h1', () => {
    const reg = new Registry().add(Paragraphs, Header)
    const result = parseinline(reg, Paragraphs, '# Heading One')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<h1>')
    expect(html).toContain('Heading One')
  })

  it('## text renders as h2', () => {
    const reg = new Registry().add(Paragraphs, Header)
    const result = parseinline(reg, Paragraphs, '## Heading Two')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<h2>')
  })

  it('###### renders as h6', () => {
    const reg = new Registry().add(Paragraphs, Header)
    const result = parseinline(reg, Paragraphs, '###### H6')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<h6>')
  })
})

describe('Blockquote', () => {
  it('has name "blockquote"', () => expect(Blockquote.name).toBe('blockquote'))

  it('renders in <blockquote> tag', () => {
    const reg = new Registry().add(Blockquote)
    const tag = parse(reg, [{ name: 'blockquote', args: '' }, 'some text'])
    const html = render(tag)
    expect(html).toContain('<blockquote>')
    expect(html).toContain('some text')
  })
})

describe('Code', () => {
  it('has name "code"', () => expect(Code.name).toBe('code'))

  it('renders in <pre><code> tags', () => {
    const reg = new Registry().add(Code)
    const tag = parse(reg, [{ name: 'code', args: '' }, 'const x = 1'])
    const html = render(tag)
    expect(html).toContain('<pre>')
    expect(html).toContain('<code>')
    expect(html).toContain('const x = 1')
  })

  it('does not parse inline elements inside code', () => {
    const reg = new Registry().add(Code, Bold)
    const tag = parse(reg, [{ name: 'code', args: '' }, '*bold* is not parsed'])
    const html = render(tag)
    // Bold should NOT be rendered inside code (NONE nesting)
    expect(html).not.toContain('<strong>')
    expect(html).toContain('*bold*')
  })
})

describe('HorizontalRule', () => {
  it('has name "horizontal-rule"', () => expect(HorizontalRule.name).toBe('horizontal-rule'))

  it('renders as <hr>', () => {
    const reg = new Registry().add(HorizontalRule)
    const tag = parse(reg, [{ name: 'horizontal-rule', args: '' }, ''])
    const html = render(tag)
    expect(html).toContain('<hr>')
  })
})

describe('Paragraphs', () => {
  it('has name "paragraphs"', () => expect(Paragraphs.name).toBe('paragraphs'))

  it('splits on blank lines into <p> tags', () => {
    const reg = new Registry().add(Paragraphs, Bold)
    const tag = parse(reg, [{ name: 'paragraphs', args: '' }, 'first para\n\nsecond para'])
    const html = render(tag)
    expect(html).toContain('<p>')
    expect(html).toContain('first para')
    expect(html).toContain('second para')
  })
})

// ---------------------------------------------------------------------------
// StandardInline registry
// ---------------------------------------------------------------------------

describe('StandardInline', () => {
  it('contains all standard inline elements', () => {
    const names = StandardInline.inlines().map(e => e.name)
    expect(names).toContain('bold')
    expect(names).toContain('italic')
    expect(names).toContain('monospace')
    expect(names).toContain('link')
    expect(names).toContain('inline-image')
  })

  it('renders bold and italic together via parseinline', () => {
    const result = parseinline(StandardInline, Paragraphs, 'text *bold* and _italic_')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })
})

// ---------------------------------------------------------------------------
// Standard registry — integration
// ---------------------------------------------------------------------------

describe('Standard registry', () => {
  // Helper: parse a plain text string via the paragraphs root block
  function parseDoc(reg: Registry, text: string) {
    return parse(reg, [{ name: 'paragraphs', args: '' }, text])
  }

  it('contains both inline and block elements', () => {
    expect(Standard.inlines().length).toBeGreaterThan(0)
    expect(Standard.blocks().length).toBeGreaterThan(0)
  })

  it('parse + render produces valid HTML for common markdown-like text', () => {
    const text = 'Hello *world* and _italic_'
    const tag = parseDoc(Standard, text)
    const html = render(tag)
    expect(html).toContain('<strong>world</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('never throws on arbitrary plain text', () => {
    fc.assert(fc.property(
      fc.string().filter(s => !s.includes('---') && !s.includes('...')),
      text => {
        expect(() => render(parseDoc(Standard, text))).not.toThrow()
      }
    ))
  })

  it('property: *...*  in text → <strong> in output', () => {
    fc.assert(fc.property(
      fc.string().filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.length > 0),
      content => {
        const text = `before *${content}* after`
        const html = render(parseDoc(Standard, text))
        return html.includes('<strong>') && html.includes('</strong>')
      }
    ))
  })

  it('property: _..._ in text → <em> in output', () => {
    fc.assert(fc.property(
      fc.string().filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.length > 0),
      content => {
        const text = `before _${content}_ after`
        const html = render(parseDoc(Standard, text))
        return html.includes('<em>') && html.includes('</em>')
      }
    ))
  })
})
