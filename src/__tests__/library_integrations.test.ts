import { describe, it, expect } from 'vitest'
import {
  Katex, Mermaid,
} from '../library'
import { render } from '../html'
import { parse, Registry } from '../index'

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
})
