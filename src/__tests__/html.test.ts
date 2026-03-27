import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render } from '../html'
import type { Tag } from '../index'

// ---------------------------------------------------------------------------
// Tag shorthand parsing
// ---------------------------------------------------------------------------

describe('render() — tag shorthand parsing', () => {
  it('plain tag name', () => {
    expect(render([['div', {}]])).toBe('<div></div>')
  })

  it('tag with single class', () => {
    expect(render([['div.wrapper', {}]])).toBe('<div class="wrapper"></div>')
  })

  it('tag with multiple classes', () => {
    expect(render([['div.foo.bar', {}]])).toBe('<div class="foo bar"></div>')
  })

  it('tag with id', () => {
    expect(render([['div#main', {}]])).toBe('<div id="main"></div>')
  })

  it('tag with id and classes', () => {
    expect(render([['div#app.container.dark', {}]])).toBe('<div id="app" class="container dark"></div>')
  })

  it('class in shorthand merges with class in attrs object', () => {
    expect(render([['div.a', {class: 'b'}]])).toBe('<div class="a b"></div>')
  })

  it('id in attrs object takes precedence over shorthand id', () => {
    // Explicit attr id wins
    const result = render([['div#a', {id: 'b'}]])
    expect(result).toBe('<div id="b"></div>')
  })
})

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

describe('render() — attributes', () => {
  it('string attribute', () => {
    expect(render([['a', {href: 'https://example.com'}]])).toBe('<a href="https://example.com"></a>')
  })

  it('boolean attribute true renders as attribute name', () => {
    expect(render([['input', {disabled: true}]])).toBe('<input disabled>')
  })

  it('boolean attribute false omits the attribute', () => {
    expect(render([['input', {disabled: false}]])).toBe('<input>')
  })

  it('numeric attribute renders as string value', () => {
    expect(render([['input', {tabindex: 1}]])).toBe('<input tabindex="1">')
  })

  it('style object is serialized to CSS string', () => {
    const result = render([['div', {style: {color: 'red', fontSize: '12px'}}]])
    expect(result).toContain('style="')
    expect(result).toContain('color:red')
    expect(result).toContain('font-size:12px')
  })

  it('multiple attributes are all rendered', () => {
    const result = render([['a', {href: '/path', title: 'click'}]])
    expect(result).toContain('href="/path"')
    expect(result).toContain('title="click"')
  })
})

// ---------------------------------------------------------------------------
// Void elements (self-closing)
// ---------------------------------------------------------------------------

describe('render() — void elements', () => {
  it('img is self-closing', () => {
    expect(render([['img', {src: 'a.png', alt: 'a'}]])).toBe('<img src="a.png" alt="a">')
  })

  it('br is self-closing', () => {
    expect(render([['br', {}]])).toBe('<br>')
  })

  it('input is self-closing', () => {
    expect(render([['input', {type: 'text'}]])).toBe('<input type="text">')
  })

  it('hr is self-closing', () => {
    expect(render([['hr', {}]])).toBe('<hr>')
  })
})

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

describe('render() — children', () => {
  it('text child is rendered literally', () => {
    expect(render([['p', {}], 'hello'])).toBe('<p>hello</p>')
  })

  it('multiple text children are concatenated', () => {
    expect(render([['p', {}], 'hello', ' ', 'world'])).toBe('<p>hello world</p>')
  })

  it('nested element as child', () => {
    expect(render([['div', {}], [['strong', {}], 'bold']])).toBe('<div><strong>bold</strong></div>')
  })

  it('mixed text and element children', () => {
    expect(render([['p', {}], 'text ', [['em', {}], 'italic'], ' end'])).toBe('<p>text <em>italic</em> end</p>')
  })

  it('deeply nested', () => {
    expect(render([['ul', {}], [['li', {}], 'item']])).toBe('<ul><li>item</li></ul>')
  })
})

// ---------------------------------------------------------------------------
// HTML entity escaping in text nodes
// ---------------------------------------------------------------------------

describe('render() — HTML entity escaping', () => {
  it('escapes < in text', () => {
    expect(render([['p', {}], 'a < b'])).toBe('<p>a &lt; b</p>')
  })

  it('escapes > in text', () => {
    expect(render([['p', {}], 'a > b'])).toBe('<p>a &gt; b</p>')
  })

  it('escapes & in text', () => {
    expect(render([['p', {}], 'a & b'])).toBe('<p>a &amp; b</p>')
  })

  it('escapes " in text', () => {
    expect(render([['p', {}], 'say "hi"'])).toBe('<p>say &quot;hi&quot;</p>')
  })
})

// ---------------------------------------------------------------------------
// render() on a plain string
// ---------------------------------------------------------------------------

describe('render() — string input', () => {
  it('returns the string as-is (escaped)', () => {
    expect(render('hello')).toBe('hello')
  })

  it('escapes HTML entities in raw string', () => {
    expect(render('<script>')).toBe('&lt;script&gt;')
  })
})

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

describe('render() — property-based', () => {
  const safeString = fc.string().filter(s => s.length < 50)
  const tagName = fc.constantFrom('div', 'span', 'p', 'strong', 'em', 'code', 'a')

  it('property: result always contains the opening tag', () => {
    fc.assert(fc.property(tagName, tag => {
      const result = render([[tag, {}]])
      return result.startsWith(`<${tag}`)
    }))
  })

  it('property: result for non-void tags always has matching close tag', () => {
    fc.assert(fc.property(tagName, tag => {
      const result = render([[tag, {}]])
      return result.includes(`</${tag}>`)
    }))
  })

  it('property: classes in shorthand appear in class attribute', () => {
    fc.assert(fc.property(
      tagName,
      fc.array(fc.stringMatching(/^[a-z][a-z0-9-]*$/), { minLength: 1, maxLength: 3 }),
      (tag, classes) => {
        const shorthand = `${tag}.${classes.join('.')}`
        const result = render([[shorthand, {}]])
        return classes.every(c => result.includes(c))
      }
    ))
  })

  it('property: text content (no special chars) appears verbatim in output', () => {
    fc.assert(fc.property(
      fc.string().filter(s => s.length > 0 && !/[<>&"]/.test(s)),
      text => render([['div', {}], text]).includes(text)
    ))
  })

  it('property: rendering is deterministic', () => {
    fc.assert(fc.property(tagName, safeString, (tag, text) => {
      const node: Tag = [[tag, {}], text]
      return render(node) === render(node)
    }))
  })

  it('property: text content is always HTML-entity-escaped correctly', () => {
    fc.assert(fc.property(
      fc.string(),
      text => {
        const result = render([['div', {}], text])
        const inner = result.slice('<div>'.length, result.length - '</div>'.length)
        const expected = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
        return inner === expected
      }
    ))
  })
})
