import { parse } from './parser'
import { render } from './html'
import { Registry } from './parser'
import {
  Standard, StandardExtended, StandardInline, CriticMarkup,
  Bold, Italic, Monospace, Underline, Strikethrough,
  Superscript, Subscript, Link, InlineImage, FullImage, Tooltip, Header,
  Blockquote, Code, HorizontalRule, SideBySide, Paragraphs,
  UnorderedList, OrderedList,
  CriticAdd, CriticDel, CriticHighlight, CriticComment, CriticSub,
  Katex, Mermaid,
} from './library'
import type { Tag } from './parser'

export interface RenderAllOptions {
  /** Registry to use. Defaults to StandardExtended. */
  registry?: Registry
  /** Name of the top-level block element. Defaults to 'paragraphs'. */
  top?: string
  /** CSS selector for script elements. Defaults to 'script[type="glue"]'. */
  selector?: string
}

/**
 * Find all `<script type="glue">` elements, parse and render each one,
 * then insert the resulting HTML immediately after each script element.
 *
 * Does NOT run automatically — call explicitly, like KaTeX's renderMathInElement.
 *
 * @example
 * document.addEventListener('DOMContentLoaded', () => Glue.renderAll())
 */
export function renderAll(options: RenderAllOptions = {}): void {
  const {
    registry = StandardExtended,
    top = 'paragraphs',
    selector = 'script[type="glue"]',
  } = options

  document.querySelectorAll<HTMLScriptElement>(selector).forEach(script => {
    const text = script.textContent ?? ''
    const tag: Tag = parse(registry, [{ name: top, args: '' }, text])
    const html = render(tag)
    const fragment = document.createRange().createContextualFragment(html)
    script.parentNode?.insertBefore(fragment, script.nextSibling)
  })
}

export {
  parse, render, Registry,
  Standard, StandardExtended, StandardInline, CriticMarkup,
  Bold, Italic, Monospace, Underline, Strikethrough,
  Superscript, Subscript, Link, InlineImage, FullImage, Tooltip, Header,
  Blockquote, Code, HorizontalRule, SideBySide, Paragraphs,
  UnorderedList, OrderedList,
  CriticAdd, CriticDel, CriticHighlight, CriticComment, CriticSub,
  Katex, Mermaid,
}
