import { describe, it, expect, beforeEach } from 'vitest'
import { renderAll, injectAssets, enhance } from '../browser'
import { Standard } from '../library'

describe('renderAll', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.head.querySelectorAll('meta[name="glue-assets"], script, link, style').forEach(n => n.remove())
  })

  it('renders a single script[type=glue] into the DOM', () => {
    document.body.innerHTML = `<script type="glue">*hello*</script>`
    renderAll({ registry: Standard })
    expect(document.body.innerHTML).toContain('<strong>hello</strong>')
  })

  it('inserts rendered HTML after the script element', () => {
    document.body.innerHTML = `
      <div id="before"></div>
      <script type="glue">_world_</script>
      <div id="after"></div>
    `
    renderAll({ registry: Standard })
    const html = document.body.innerHTML
    const emPos = html.indexOf('<em>')
    expect(emPos).toBeGreaterThan(html.indexOf('id="before"'))
    expect(emPos).toBeLessThan(html.indexOf('id="after"'))
  })

  it('processes multiple script elements', () => {
    document.body.innerHTML = `
      <script type="glue">*a*</script>
      <script type="glue">_b_</script>
    `
    renderAll({ registry: Standard })
    expect(document.body.innerHTML).toContain('<strong>a</strong>')
    expect(document.body.innerHTML).toContain('<em>b</em>')
  })

  it('defaults to StandardExtended registry', () => {
    document.body.innerHTML = `<script type="glue">{++added++}</script>`
    renderAll()
    expect(document.body.innerHTML).toContain('<ins>added</ins>')
  })

  it('only processes elements matching selector', () => {
    document.body.innerHTML = `
      <script type="glue">*yes*</script>
      <script type="text/plain">*no*</script>
    `
    renderAll({ registry: Standard })
    expect(document.body.innerHTML).toContain('<strong>yes</strong>')
    expect(document.body.innerHTML).not.toContain('<strong>no</strong>')
  })

  it('injects registry CSS/JS into document.head', async () => {
    document.body.innerHTML = `<script type="glue">*hi*</script>`
    await renderAll({ registry: Standard })
    expect(document.head.querySelector('meta[name="glue-assets"]')).toBeTruthy()
    expect(document.head.querySelector('link[href*="katex"]')).toBeTruthy()
    expect(document.head.querySelector('script[src*="mermaid"]')).toBeTruthy()
    expect(document.head.querySelector('script[src*="highlight"]')).toBeTruthy()
  })

  it('injectAssets is idempotent', async () => {
    await injectAssets(Standard)
    await injectAssets(Standard)
    expect(document.head.querySelectorAll('meta[name="glue-assets"]')).toHaveLength(1)
    expect(document.head.querySelectorAll('script[src*="katex"]').length).toBe(1)
  })
})

describe('enhance', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    delete (window as any).katex
    delete (window as any).hljs
    delete (window as any).mermaid
  })

  it('renders katex when window.katex is present', async () => {
    const calls: string[] = []
    ;(window as any).katex = {
      render(tex: string, el: Element) {
        calls.push(tex)
        el.innerHTML = `<span class="katex-html">${tex}</span>`
      },
    }
    document.body.innerHTML = `<div class="katex">x^2</div>`
    await enhance(document)
    expect(calls).toEqual(['x^2'])
    expect(document.body.innerHTML).toContain('katex-html')
  })

  it('highlights code when window.hljs is present', async () => {
    const els: Element[] = []
    ;(window as any).hljs = {
      highlightElement(el: Element) {
        els.push(el)
        el.classList.add('hljs')
      },
    }
    document.body.innerHTML = `<pre><code class="language-js">const x = 1</code></pre>`
    await enhance(document)
    expect(els).toHaveLength(1)
  })

  it('skips katex when the library is absent', async () => {
    document.body.innerHTML = `<div class="katex">x^2</div>`
    await enhance(document)
    expect(document.querySelector('.katex')!.textContent).toBe('x^2')
  })
})
