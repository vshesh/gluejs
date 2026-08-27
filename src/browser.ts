import { parse, toHTML } from './index'
import { render } from './html'
import { Registry } from './parser'
import {
  Standard, StandardExtended, StandardInline, CriticMarkup, Markdown, MarkdownInline, Music,
  Bold, Italic, Monospace, Underline, Strikethrough,
  Superscript, Subscript, Link, InlineImage, FullImage, Tooltip, Header, Classed, TagBasic, TagAttributes, Audio,
  Blockquote, Aside, Code, HorizontalRule, SideBySide, Matrix, Figure, Paragraphs, NoopBlock, List,
  UnorderedList, OrderedList, Youtube, Video, Slideshow, PdfObject, CodeBySide,
  CriticAdd, CriticDel, CriticHighlight, CriticComment, CriticSub,
  Katex, Mermaid, Pictogram, MithrilLink, Stacked, AnnotatedCode,
  YamlComponent, JsonComponent, GuitarChord, MusicalAbc,
} from './library'
import {
  AssetType, assetUrl, assetInline,
} from './elements'
import type { Tag } from './parser'
import type { Block } from './elements'

export interface RenderAllOptions {
  /** Registry to use. Defaults to StandardExtended. */
  registry?: Registry
  /** Name of the top-level block element. Defaults to 'paragraphs'. */
  top?: string
  /** CSS selector for script elements. Defaults to 'script[type="glue"]'. */
  selector?: string
}

type Enhancers = {
  katex?: { render: (tex: string, el: Element, opts?: object) => void }
  mermaid?: {
    initialize: (opts: object) => void
    run: (opts: { nodes: Element[] }) => Promise<unknown>
  }
  hljs?: { highlightElement: (el: Element) => void }
  PDFObject?: { embed: (url: string, el: Element) => void }
  ABCJS?: { renderAbc: (el: Element | string, abc: string) => unknown }
}

const jsdom = () => typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)

/**
 * Insert registry CSS/JS into document.head once.
 * Recreates <script> nodes so they actually execute (innerHTML does not).
 */
export async function injectAssets(registry: Registry): Promise<void> {
  if (typeof document === 'undefined') return
  if (document.querySelector('meta[name="glue-assets"]')) return
  const html = registry.assets()
  if (!html) return
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'glue-assets')
  document.head.append(meta)

  const box = document.createElement('template')
  box.innerHTML = html
  const wait: Promise<void>[] = []
  for (const node of [...box.content.childNodes]) {
    if (!(node instanceof Element)) continue
    if (node instanceof HTMLScriptElement) {
      const s = document.createElement('script')
      for (const a of Array.from(node.attributes)) s.setAttribute(a.name, a.value)
      s.async = false
      if (!s.src) s.textContent = node.textContent
      else if (!jsdom()) {
        wait.push(new Promise<void>(res => {
          s.addEventListener('load', () => res(), { once: true })
          s.addEventListener('error', () => res(), { once: true })
        }))
      }
      document.head.append(s)
    } else {
      document.head.append(node)
    }
  }
  if (wait.length) await Promise.all(wait)
}

/** Run KaTeX / Mermaid / highlight.js against already-inserted HTML. */
export async function enhance(root: ParentNode = document): Promise<void> {
  if (typeof window === 'undefined') return
  const w = window as Window & Enhancers
  root.querySelectorAll('.katex').forEach(el => {
    if (!w.katex || el.querySelector('.katex-html, .katex-mathml')) return
    const tex = el.textContent ?? ''
    try { w.katex.render(tex.trim(), el, { throwOnError: false, displayMode: true }) } catch { /* keep source */ }
  })
  if (w.hljs) {
    root.querySelectorAll('pre code').forEach(el => {
      if (!el.classList.contains('hljs')) w.hljs!.highlightElement(el)
    })
  }
  if (w.mermaid) {
    w.mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
    const nodes = [...root.querySelectorAll('.mermaid')].filter(n => !n.querySelector('svg'))
    if (nodes.length) await w.mermaid.run({ nodes })
  }
  if (w.PDFObject) {
    root.querySelectorAll('.pdf-object').forEach(el => {
      if (el.querySelector('iframe, embed, object')) return
      const url = (el.textContent ?? '').trim()
      if (url) w.PDFObject!.embed(url, el)
    })
  }
  if (w.ABCJS) {
    root.querySelectorAll('.musical-abc').forEach(el => {
      if (el.querySelector('svg')) return
      const abc = el.textContent ?? ''
      el.textContent = ''
      w.ABCJS!.renderAbc(el, abc)
    })
  }
}

/**
 * Find all `<script type="glue">` elements, parse and render each one,
 * then insert the resulting HTML immediately after each script element.
 *
 * Injects registry CSS/JS (KaTeX, Mermaid, highlight.js, …) into document.head,
 * then enhances the inserted markup once those scripts load.
 *
 * Does NOT run automatically — call explicitly, like KaTeX's renderMathInElement.
 *
 * @example
 * document.addEventListener('DOMContentLoaded', () => Glue.renderAll())
 */
export function renderAll(options: RenderAllOptions = {}): Promise<void> {
  const {
    registry = StandardExtended,
    top = 'paragraphs',
    selector = 'script[type="glue"]',
  } = options

  const pending = injectAssets(registry)
  document.querySelectorAll<HTMLScriptElement>(selector).forEach(script => {
    const text = script.textContent ?? ''
    const html = toHTML(text, registry, top)
    const fragment = document.createRange().createContextualFragment(html)
    script.parentNode?.insertBefore(fragment, script.nextSibling)
  })
  return pending.then(() => enhance(document))
}

/**
 * Replace an element's text with rendered glue HTML.
 * Use like markdown-it's `md.render` on a container.
 */
export async function renderElement(el: Element, options: { registry?: Registry, top?: string } = {}): Promise<void> {
  const { registry = StandardExtended, top = 'paragraphs' } = options
  el.innerHTML = toHTML(el.textContent ?? '', registry, top)
  await injectAssets(registry)
  await enhance(el)
}

export {
  parse, render, toHTML, Registry,
  AssetType, assetUrl, assetInline,
  Standard, StandardExtended, StandardInline, CriticMarkup, Markdown, MarkdownInline, Music,
  Bold, Italic, Monospace, Underline, Strikethrough,
  Superscript, Subscript, Link, InlineImage, FullImage, Tooltip, Header, Classed, TagBasic, TagAttributes, Audio,
  Blockquote, Aside, Code, HorizontalRule, SideBySide, Matrix, Figure, Paragraphs, NoopBlock, List,
  UnorderedList, OrderedList, Youtube, Video, Slideshow, PdfObject, CodeBySide,
  CriticAdd, CriticDel, CriticHighlight, CriticComment, CriticSub,
  Katex, Mermaid, Pictogram, MithrilLink, Stacked, AnnotatedCode,
  YamlComponent, JsonComponent, GuitarChord, MusicalAbc,
}
export type { Tag, Block }
