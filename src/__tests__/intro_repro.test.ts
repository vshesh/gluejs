import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { parse } from '../parser'
import { render } from '../html'
import { StandardExtended } from '../library'

const docs = readFileSync('docs/index.html', 'utf8')
const scripts = [...docs.matchAll(/<script type="glue">([\s\S]*?)<\/script>/g)].map(m => m[1])

describe('docs/index.html glue sections', () => {
  it('finds the four documentation sections', () => {
    expect(scripts.length).toBe(4)
  })

  it.each(scripts.map((s, i) => [i, s.slice(0, 40).replace(/\s+/g, ' ')]))(
    'section %i parses (%s…)',
    (_i, _preview) => {
      const text = scripts[_i]
      expect(() => render(parse(StandardExtended, text))).not.toThrow()
    }
  )

  it('intro renders title, emphasis, and blockquote', () => {
    const html = render(parse(StandardExtended, scripts[0]))
    expect(html).toMatch(/<h1[^>]*>/)
    expect(html).toContain('<strong>Glue</strong>')
    expect(html).toContain('<blockquote')
  })

  it('tour renders inlines, lists, critic, katex, and mermaid', () => {
    const html = render(parse(StandardExtended, scripts[1]))
    expect(html).toContain('<strong>Bold</strong>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<ins>')
    expect(html).toContain('class="katex"')
    expect(html).toContain('\\int_0^\\infty')
    expect(html).toContain('class="mermaid"')
    expect(html).toContain('Registry')
  })

  it('anatomy and api compile to headings and code samples', () => {
    const anatomy = render(parse(StandardExtended, scripts[2]))
    const api = render(parse(StandardExtended, scripts[3]))
    expect(anatomy).toMatch(/<h1[^>]*>/)
    expect(anatomy).toContain('<pre>')
    expect(api).toContain('toHTML')
    expect(api).toContain('assetUrl')
  })
})

describe('zero-content block (horizontal-rule repro)', () => {
  it('parses ---horizontal-rule without throwing', () => {
    const text = '\n## Horizontal Rule\n\n---horizontal-rule\n...\n'
    expect(() => render(parse(StandardExtended, text))).not.toThrow()
  })
})
