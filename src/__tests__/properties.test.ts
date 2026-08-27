import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { parse, toHTML, render, Registry } from '../index'
import {
  Standard, Paragraphs, Bold, Italic, SideBySide, NoopBlock,
} from '../library'

const word = fc.stringMatching(/^[a-zA-Z]{3,10}$/)
const words = fc.array(word, { minLength: 1, maxLength: 6 }).map(ws => ws.join(' '))
const plain = fc.stringMatching(/^[a-zA-Z0-9 ,.;:!?]+$/).filter(s => s.trim().length > 0)

const html = (text: string, reg = Standard) => toHTML(text, reg)

describe('toHTML / parse(string) public API', () => {
  it('parse(registry, text) uses registry.top', () => {
    const tag = parse(Standard, '*hello*')
    expect(render(tag)).toContain('<strong>hello</strong>')
  })

  it('toHTML is render(parse(...))', () => {
    expect(toHTML('*hello*')).toBe(render(parse(Standard, '*hello*')))
  })

  it('parse with an explicit top block', () => {
    const tag = parse(new Registry([NoopBlock, Bold], { top: NoopBlock }), '*x*', NoopBlock)
    expect(render(tag)).toContain('<strong>x</strong>')
  })

  it('throws when the registry has no top and none is passed', () => {
    expect(() => parse(new Registry([Bold]), 'hi')).toThrow(/top block/i)
  })
})

describe('unescape', () => {
  it('\\* is a literal asterisk, not bold', () => {
    expect(html('not \\*bold\\*')).toContain('*bold*')
    expect(html('not \\*bold\\*')).not.toContain('<strong>')
  })

  it('property: escaped delimiters round-trip to the delimiter character', () => {
    fc.assert(fc.property(word, w => {
      const out = html(`x \\*${w}\\* y`)
      return out.includes(`*${w}*`) && !out.includes('<strong>')
    }))
  })
})

describe('Display.BLOCK headers', () => {
  it('consecutive headers on their own lines are not wrapped in <p>', () => {
    const out = html('# h1\n## h2\n### h3')
    expect(out).toContain('<h1>')
    expect(out).toContain('<h2>')
    expect(out).toContain('<h3>')
    expect(out).not.toMatch(/<p[^>]*>\s*<h1/)
  })

  it('headers get slug ids', () => {
    const out = html('# Hello World')
    expect(out).toContain('id="hello-world"')
    expect(out).toContain('Hello World')
  })

  it('property: heading level matches the number of #', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 6 }), word, (n, title) => {
      const out = html(`${'#'.repeat(n)} ${title}`)
      return out.includes(`<h${n}>`) && out.includes(title)
    }))
  })
})

describe('content preservation', () => {
  it('property: alphanumeric words survive parse+render', () => {
    fc.assert(fc.property(fc.array(word, { minLength: 3, maxLength: 8 }), ws => {
      const out = html(ws.join(' '))
      return ws.every(w => out.includes(w))
    }))
  })

  it('property: toHTML is deterministic', () => {
    fc.assert(fc.property(plain, t => html(t) === html(t)))
  })

  it('property: parse+render never throws on mixed documents of safe blocks', () => {
    const arbBlock = fc.oneof(
      words,
      words.map(s => `---code\n${s}\n...`),
      words.map(s => `---blockquote\n${s}\n...`),
      words.map(s => `---list\n${s}\n...`),
    )
    fc.assert(fc.property(fc.array(arbBlock, { minLength: 1, maxLength: 4 }), blocks => {
      expect(() => html(blocks.join('\n\n'))).not.toThrow()
    }))
  })
})

describe('inline wrapping is invertible on content', () => {
  const cases: [string, string, string][] = [
    ['*', 'strong', 'bold'],
    ['_', 'em', 'italic'],
    ['`', 'code', 'mono'],
    ['~', 'del', 'strike'],
  ]
  for (const [d, tag, name] of cases) {
    it(`property: ${name} content is inside <${tag}>`, () => {
      fc.assert(fc.property(word, w => {
        const out = html(`${d}${w}${d}`)
        return out.includes(`<${tag}>${w}</${tag}>`)
      }))
    })
  }
})

describe('List', () => {
  it('flat items become <li>', () => {
    const out = html('---list\none\ntwo\nthree\n...')
    expect(out).toContain('<ul>')
    expect(out).toMatch(/<li>one<\/li>/)
    expect(out).toContain('two')
    expect(out).toContain('three')
  })

  it('indent creates nested lists (python parity)', () => {
    const text = `---list
A
B
  a
  b
    c
D
...`
    const out = html(text)
    expect(out).toContain('<ul>')
    expect(out.match(/<ul>/g)?.length).toBeGreaterThan(1)
    expect(out).toContain('>c<')
  })

  it('-o flag (or ordered-list) yields <ol>', () => {
    expect(html('---list -o\none\ntwo\n...')).toContain('<ol>')
    expect(html('---ordered-list\n1. one\n2. two\n...')).toContain('<ol>')
  })

  it('property: every item appears in the output', () => {
    fc.assert(fc.property(fc.array(word, { minLength: 2, maxLength: 6 }), items => {
      const out = html(`---list\n${items.join('\n')}\n...`)
      return items.every(i => out.includes(i)) && out.includes('<ul>')
    }))
  })
})

describe('Matrix / SideBySide', () => {
  it('SideBySide splits on | and keeps cell text', () => {
    const out = html('---side-by-side\nleft | right\n...')
    expect(out).toContain('left')
    expect(out).toContain('right')
    expect(out).toContain('display:flex')
  })

  it('escaped pipes stay in the cell', () => {
    const tag = parse(new Registry([SideBySide, Paragraphs], { top: Paragraphs }),
      [{ name: 'side-by-side', args: '' }, 'c \\| x'] as any)
    expect(JSON.stringify(tag)).toContain('|')
  })

  it('property: matrix cells survive', () => {
    fc.assert(fc.property(
      fc.array(fc.array(word, { minLength: 2, maxLength: 3 }), { minLength: 1, maxLength: 3 })
        .filter(rows => rows.every(r => r.length === rows[0].length)),
      rows => {
        const text = rows.map(r => r.join('|')).join('\n')
        const out = html(`---matrix\n${text}\n...`)
        return rows.every(r => r.every(c => out.includes(c)))
      }
    ))
  })
})

describe('Aside / Figure / Audio / Code language', () => {
  it('aside restyles paragraphs', () => {
    expect(html('---aside\nhello\n...')).toContain('<aside>')
  })

  it('figure uses the first paragraph as caption when blank-line separated', () => {
    const out = html('---figure\nA caption\n\nThe body\n...')
    expect(out).toContain('<figure>')
    expect(out).toContain('<figcaption>')
    expect(out).toContain('A caption')
    expect(out).toContain('The body')
  })

  it('@{url} becomes <audio>', () => {
    expect(html('@{https://ex.com/a.mp3}')).toContain('<audio')
    expect(html('@{https://ex.com/a.mp3}')).toContain('https://ex.com/a.mp3')
  })

  it('---code javascript adds a language class', () => {
    expect(html('---code javascript\nconst x = 1\n...')).toContain('language-javascript')
  })
})

describe('Nesting.SUB vs POST vs NONE', () => {
  it('NONE does not interpret inline markup', () => {
    expect(html('---code\n*bold*\n...')).toContain('*bold*')
    expect(html('---code\n*bold*\n...')).not.toContain('<strong>')
  })

  it('POST/SUB still parse inlines inside blockquote', () => {
    expect(html('---blockquote\n*hi*\n...')).toContain('<strong>hi</strong>')
  })

  it('property: terminal blocks are total for arbitrary bodies', () => {
    fc.assert(fc.property(fc.string().filter(s => !s.includes('...')), s => {
      expect(() => html(`---code\n${s}\n...`)).not.toThrow()
    }))
  })
})

describe('Registry compile cache invalidation', () => {
  it('newly added inlines are picked up after add()', () => {
    const r = new Registry([Paragraphs, Italic], { top: Paragraphs })
    expect(toHTML('*x*', r)).not.toContain('<strong>')
    r.add(Bold)
    expect(toHTML('*x*', r)).toContain('<strong>x</strong>')
  })
})
