import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  CriticAdd, CriticDel, CriticHighlight, CriticComment, CriticSub,
  UnorderedList, OrderedList,
  CriticMarkup, StandardExtended, Standard, Markdown,
  Paragraphs,
} from '../library'
import { render } from '../html'
import { parse, parseinline, Registry } from '../index'
import type { Tag } from '../index'

// ---------------------------------------------------------------------------
// CriticMarkup inline elements
// ---------------------------------------------------------------------------

describe('CriticAdd', () => {
  it('has name "critic-add"', () => expect(CriticAdd.name).toBe('critic-add'))

  it('{++text++} renders as <ins>', () => {
    const reg = new Registry().add(Paragraphs, CriticAdd)
    const result = parseinline(reg, Paragraphs, '{++added++}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<ins>')
    expect(html).toContain('added')
  })
})

describe('CriticDel', () => {
  it('has name "critic-del"', () => expect(CriticDel.name).toBe('critic-del'))

  it('{--text--} renders as <del>', () => {
    const reg = new Registry().add(Paragraphs, CriticDel)
    const result = parseinline(reg, Paragraphs, '{--deleted--}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<del>')
    expect(html).toContain('deleted')
  })
})

describe('CriticHighlight', () => {
  it('has name "critic-highlight"', () => expect(CriticHighlight.name).toBe('critic-highlight'))

  it('{==text==} renders as <mark>', () => {
    const reg = new Registry().add(Paragraphs, CriticHighlight)
    const result = parseinline(reg, Paragraphs, '{==highlighted==}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<mark>')
    expect(html).toContain('highlighted')
  })
})

describe('CriticComment', () => {
  it('has name "critic-comment"', () => expect(CriticComment.name).toBe('critic-comment'))

  it('{>>text<<} renders as <span> with critic comment class', () => {
    const reg = new Registry().add(Paragraphs, CriticComment)
    const result = parseinline(reg, Paragraphs, '{>>a comment<<}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<span')
    expect(html).toContain('critic')
    expect(html).toContain('a comment')
  })
})

describe('CriticSub', () => {
  it('has name "critic-sub"', () => expect(CriticSub.name).toBe('critic-sub'))

  it('{~~old~>new~~} renders old as <del> and new as <ins>', () => {
    const reg = new Registry().add(Paragraphs, CriticSub)
    const result = parseinline(reg, Paragraphs, '{~~old~>new~~}')
    const html = render([['div', {}], ...result] as Tag)
    expect(html).toContain('<del>')
    expect(html).toContain('<ins>')
    expect(html).toContain('old')
    expect(html).toContain('new')
  })
})

// ---------------------------------------------------------------------------
// List block elements
// ---------------------------------------------------------------------------

describe('UnorderedList', () => {
  it('has name "unordered-list"', () => expect(UnorderedList.name).toBe('unordered-list'))

  it('renders lines starting with - as <li> inside <ul>', () => {
    const reg = new Registry().add(UnorderedList)
    const tag = parse(reg, [{ name: 'unordered-list', args: '' }, '- item one\n- item two\n- item three'])
    const html = render(tag)
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
    expect(html).toContain('item one')
    expect(html).toContain('item two')
    expect(html).toContain('item three')
  })

  it('strips the leading - from each item', () => {
    const reg = new Registry().add(UnorderedList)
    const tag = parse(reg, [{ name: 'unordered-list', args: '' }, '- only item'])
    const html = render(tag)
    expect(html).not.toContain('- only')
    expect(html).toContain('only item')
  })
})

describe('OrderedList', () => {
  it('has name "ordered-list"', () => expect(OrderedList.name).toBe('ordered-list'))

  it('renders numbered lines as <li> inside <ol>', () => {
    const reg = new Registry().add(OrderedList)
    const tag = parse(reg, [{ name: 'ordered-list', args: '' }, '1. first\n2. second\n3. third'])
    const html = render(tag)
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>')
    expect(html).toContain('first')
    expect(html).toContain('second')
  })

  it('strips the leading number from each item', () => {
    const reg = new Registry().add(OrderedList)
    const tag = parse(reg, [{ name: 'ordered-list', args: '' }, '1. only item'])
    const html = render(tag)
    expect(html).not.toContain('1.')
    expect(html).toContain('only item')
  })
})

// ---------------------------------------------------------------------------
// CriticMarkup registry
// ---------------------------------------------------------------------------

describe('CriticMarkup registry', () => {
  it('contains all critic elements', () => {
    const names = CriticMarkup.inlines().map(e => e.name)
    expect(names).toContain('critic-add')
    expect(names).toContain('critic-del')
    expect(names).toContain('critic-highlight')
    expect(names).toContain('critic-comment')
    expect(names).toContain('critic-sub')
  })

  it('does not include non-critic elements', () => {
    const names = CriticMarkup.inlines().map(e => e.name)
    expect(names).not.toContain('bold')
    expect(names).not.toContain('italic')
  })
})

// ---------------------------------------------------------------------------
// StandardExtended registry
// ---------------------------------------------------------------------------

describe('StandardExtended registry', () => {
  it('contains all Standard elements plus critic and list elements', () => {
    const inlineNames = StandardExtended.inlines().map(e => e.name)
    const blockNames = StandardExtended.blocks().map(e => e.name)

    // Standard inline elements
    expect(inlineNames).toContain('bold')
    expect(inlineNames).toContain('italic')

    // Extended inline elements
    expect(inlineNames).toContain('critic-add')
    expect(inlineNames).toContain('critic-del')

    // Extended block elements
    expect(blockNames).toContain('unordered-list')
    expect(blockNames).toContain('ordered-list')
  })

  it('property: critic markup renders without throwing', () => {
    fc.assert(fc.property(
      fc.string().filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.length > 0),
      content => {
        const text = `before {++${content}++} after`
        expect(() => {
          const result = parseinline(StandardExtended, Paragraphs, text)
          render([['div', {}], ...result] as Tag)
        }).not.toThrow()
      }
    ))
  })
})

describe('Markdown registry', () => {
  it('**bold** and *italic* (markdown style)', () => {
    const html = render(parse(Markdown, '**bold** and *italic*'))
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })
})

describe('Classed / TagBasic / Aside / Figure', () => {
  it('.[cls](text) → span.class', () => {
    const html = render(parse(Standard, '.[note](hello)'))
    expect(html).toContain('class="note"')
    expect(html).toContain('hello')
  })

  it('<span.foo: text> → tag with class', () => {
    const html = render(parse(Standard, '<span.foo: hi>'))
    expect(html).toContain('<span')
    expect(html).toContain('foo')
    expect(html).toContain('hi')
  })

  it('aside wraps paragraphs', () => {
    const html = render(parse(Standard, '---aside\nhello\n...'))
    expect(html).toContain('<aside>')
    expect(html).toContain('hello')
  })

  it('figure caption + body', () => {
    const html = render(parse(Standard, '---figure\ncaption\n\nbody\n...'))
    expect(html).toContain('<figure>')
    expect(html).toContain('<figcaption>caption</figcaption>')
    expect(html).toContain('body')
  })

  it('<span.foo href="/x": hi> → tag with attributes', () => {
    const html = render(parse(Standard, '<span.foo href="/x": hi>'))
    expect(html).toContain('class="foo"')
    expect(html).toContain('href="/x"')
    expect(html).toContain('hi')
  })

  it('P[cat](url) is a pictogram', () => {
    const html = render(parse(Standard, 'P[cat](http://img/cat.png)'))
    expect(html).toContain('pictogram')
    expect(html).toContain('src="http://img/cat.png"')
    expect(html).toContain('pictoword')
  })

  it('M[text](href) is a mithril link component', () => {
    const html = render(parse(Standard, 'M[hi](/page)'))
    expect(html).toContain('<Link')
    expect(html).toContain('href="/page"')
    expect(html).toContain('text="hi"')
  })

  it('stacked block renders stack spans', () => {
    const html = render(parse(Standard, '---stacked\nHello\n$#one,two,three\n...\n'))
    expect(html).toContain('class="stacked"')
    expect(html).toContain('class="stack"')
    expect(html).toContain('one')
  })

  it('slideshow renders radio + images', () => {
    const html = render(parse(Standard, '---slideshow\na.png::one\nb.png::two\n...'))
    expect(html).toContain('class="slideshow"')
    expect(html).toContain('src="a.png"')
    expect(html).toContain('src="b.png"')
    expect(html).toContain('type="radio"')
  })

  it('pdf-object keeps the url', () => {
    const html = render(parse(Standard, '---pdf-object\nhttps://ex.com/a.pdf\n...'))
    expect(html).toContain('pdf-object')
    expect(html).toContain('https://ex.com/a.pdf')
  })

  it('code-by-side renders body and a code block', () => {
    const html = render(parse(Standard, '---code-by-side\n*hi*\n...'))
    expect(html).toContain('<strong>hi</strong>')
    expect(html).toContain('<pre>')
    expect(html).toContain('*hi*')
  })

  it('yaml-component becomes a custom tag', () => {
    const html = render(parse(Standard, '---yaml-component Box\ntitle: Hello\n...'))
    expect(html).toContain('<Box')
    expect(html).toContain('title="Hello"')
  })

  it('json-component parses props', () => {
    const html = render(parse(Standard, '---json-component Card\n{"n":1}\n...'))
    expect(html).toContain('<Card')
    expect(html).toContain('n="1"')
  })

  it('guitar-chord renders an svg diagram', () => {
    const html = render(parse(Standard, '---guitar-chord\ntitle: C\nfret: x 3 2 0 1 0\n...'))
    expect(html).toContain('<svg')
    expect(html).toContain('C')
    expect(html).toContain('chordChart')
  })

  it('annotated-code folds comments into titles', () => {
    const html = render(parse(Standard, '---annotated-code\n# note\ndef f():\n  return 1\n...'))
    expect(html).toContain('annotated-code')
    expect(html).toContain('title="note"')
    expect(html).toContain('def f():')
    expect(html).not.toContain('# note')
  })

  it('property: classed span always carries the class name and body', () => {
    fc.assert(fc.property(
      fc.stringMatching(/^[a-z][a-z0-9-]{1,8}$/),
      fc.stringMatching(/^[a-zA-Z]{3,8}$/),
      (cls, body) => {
        const html = render(parse(Standard, `.[${cls}](${body})`))
        return html.includes(cls) && html.includes(body)
      }
    ))
  })
})

