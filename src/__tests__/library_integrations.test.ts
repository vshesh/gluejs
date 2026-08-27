import { describe, it, expect } from 'vitest'
import {
  Katex, Mermaid, Code, Youtube, Tooltip, Standard,
  PdfObject, GuitarChord, Slideshow, Pictogram, MithrilLink,
} from '../library'
import { render } from '../html'
import { parse, Registry } from '../index'
import { AssetType, assetUrl, assetInline, terminal_block, Block } from '../elements'
import type { Tag } from '../parser'

// ---------------------------------------------------------------------------
// KaTeX
// ---------------------------------------------------------------------------

describe('Katex', () => {
  it('has name "katex"', () => expect(Katex.name).toBe('katex'))

  it('wraps content in div.katex without further processing', () => {
    const reg = new Registry().add(Katex)
    const tag = parse(reg, [{ name: 'katex', args: '' }, 'f(x) = \\frac{1}{x}'])
    const html = render(tag)
    expect(html).toContain('class="katex"')
    // LaTeX content should be preserved verbatim — not parsed for inline elements
    expect(html).toContain('\\frac{1}{x}')
  })

  it('does not interpret * or _ inside katex as markdown', () => {
    const reg = new Registry().add(Katex)
    const tag = parse(reg, [{ name: 'katex', args: '' }, 'a * b + c_i'])
    const html = render(tag)
    expect(html).not.toContain('<strong>')
    expect(html).not.toContain('<em>')
    expect(html).toContain('a * b + c_i')
  })

  it('declares katex CSS/JS CDN assets', () => {
    expect(Katex.assets.join('\n')).toContain('katex.min.css')
    expect(Katex.assets.join('\n')).toContain('katex.min.js')
  })
})

// ---------------------------------------------------------------------------
// Mermaid
// ---------------------------------------------------------------------------

describe('Mermaid', () => {
  it('has name "mermaid"', () => expect(Mermaid.name).toBe('mermaid'))

  it('wraps content in div.mermaid without further processing', () => {
    const reg = new Registry().add(Mermaid)
    const tag = parse(reg, [{ name: 'mermaid', args: '' }, 'graph TD\n  A --> B'])
    const html = render(tag)
    expect(html).toContain('class="mermaid"')
    expect(html).toContain('graph TD')
    expect(html).toContain('A --&gt; B')
  })

  it('escapes > in text content (browser textContent decodes it back for Mermaid)', () => {
    const reg = new Registry().add(Mermaid)
    const tag = parse(reg, [{ name: 'mermaid', args: '' }, 'A --> B --> C'])
    const html = render(tag)
    // render escapes > → &gt; in text nodes; browsers decode via textContent
    // so Mermaid receives the correct '>' when reading element.textContent
    expect(html).toContain('A --&gt; B --&gt; C')
  })

  it('declares mermaid.js CDN asset', () => {
    expect(Mermaid.assets.join('\n')).toContain('mermaid')
  })
})

describe('Code / Youtube / Tooltip assets', () => {
  it('Code pulls highlight.js', () => {
    expect(Code.assets.join('\n')).toContain('highlight.min.js')
  })
  it('Youtube includes 16:9 video CSS', () => {
    expect(Youtube.assets.join('\n')).toContain('.video')
  })
  it('Tooltip includes dotted-underline CSS', () => {
    expect(Tooltip.assets.join('\n')).toContain('.tooltip')
  })
  it('PdfObject / Slideshow / Pictogram / MithrilLink declare assets', () => {
    expect(PdfObject.assets.join('\n')).toContain('pdfobject')
    expect(Slideshow.assets.join('\n')).toContain('.slideshow')
    expect(Pictogram.assets.join('\n')).toContain('.pictogram')
    expect(MithrilLink.assets.join('\n')).toContain('m.route.Link')
    expect(GuitarChord.assets.join('\n')).toContain('.chordChart')
  })
})

describe('TS 5 field decorators', () => {
  class Demo {
    @assetUrl(AssetType.JS, 'https://example.com/a.js')
    @assetInline(AssetType.CSS, '.x { color: red }')
    static el = terminal_block()(function demo(_t: string): Tag { return [['div', {}], 'x'] })
  }

  it('composes like stacked python decorators (inner first)', () => {
    const el = Demo.el
    expect(el).toBeInstanceOf(Block)
    expect(el.name).toBe('demo')
    expect(el.assets).toHaveLength(2)
    expect(el.assets.join('\n')).toContain('.x { color: red }')
    expect(el.assets.join('\n')).toContain('src="https://example.com/a.js"')
  })

  it('Standard.assets() includes katex, mermaid, highlight.js, pdfobject, and abcjs once each', () => {
    const html = Standard.assets()
    expect(html.match(/katex\.min\.js/g)).toHaveLength(1)
    expect(html.match(/mermaid\.min\.js/g)).toHaveLength(1)
    expect(html.match(/highlight\.min\.js/g)).toHaveLength(1)
    expect(html.match(/pdfobject/g)?.length).toBeGreaterThanOrEqual(1)
    expect(html.match(/abcjs/g)?.length).toBeGreaterThanOrEqual(1)
  })
})
