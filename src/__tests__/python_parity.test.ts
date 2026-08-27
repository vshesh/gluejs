import { describe, it, expect } from 'vitest'
import { toHTML, Registry } from '../index'
import {
  Paragraphs, Bold, Italic, Monospace, Strikethrough,
  Superscript, Subscript, Header,
} from '../library'
import cases from './baselines/python-subset.json'

const shared = new Registry(
  [Paragraphs, Bold, Italic, Monospace, Strikethrough, Superscript, Subscript, Header],
  { top: Paragraphs },
)

/** JS wraps the top block in `div.paragraphs`; Python used a bare `div`. */
function norm(html: string): string {
  return html.replace(/ class="paragraphs"/g, '')
}

describe('python baseline (shared subset)', () => {
  it.each(cases.map(c => [c.name, c] as const))('%s', (_name, c) => {
    expect(norm(toHTML(c.src, shared)), c.src).toBe(c.html)
  })
})
