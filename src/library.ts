import * as R from 'ramda'
import {
  block, inline, link as linkHelper,
  IdenticalInline, SingleGroupInline, MirrorInline,
  Nesting, Display,
  type InlineParser, type Parser, type Tag, type BlockOptions, type SubElement,
} from './index'
import { escape } from './util'
import XRegExp from 'xregexp'
import { Registry } from './parser'

// ---------------------------------------------------------------------------
// Inline elements
// ---------------------------------------------------------------------------

export const Bold = IdenticalInline('bold', '*', 'strong')
export const Italic = IdenticalInline('italic', '_', 'em')
export const Monospace = IdenticalInline('monospace', '`', 'code')

// __ before _ so double-underscore takes priority in combined regex
export const Underline = SingleGroupInline('underline', '__', '__', 'u')
export const Strikethrough = IdenticalInline('strikethrough', '~', 'del')

export const Superscript = SingleGroupInline('superscript', '^{', '}', 'sup')
export const Subscript = SingleGroupInline('subscript', '_{', '}', 'sub')

export const Link = linkHelper('')(function link(groups): Tag {
  // groups[0] = display text, groups[1] = url
  return [['a', { href: groups[1] }], groups[0]]
})

export const InlineImage = linkHelper('!', Nesting.NONE)(function inlineImage(groups): Tag {
  return [['img', { alt: groups[0], src: groups[1] }]]
})

export const Tooltip = linkHelper('T', Nesting.POST)(function tooltip(groups): Tag {
  return [['span', { title: groups[1] }], groups[0]]
})

// ---------------------------------------------------------------------------
// Block elements
// ---------------------------------------------------------------------------

// Header as a Display.BLOCK inline — matches `# text` through `###### text`
// Nesting.FRAME allows inline elements inside headings
const headerRegex = /^(#{1,6})\s(.+)$/
export const Header = inline(
  headerRegex,
  function header(groups: string[]): Tag {
    const level = groups[0].length
    return [[`h${level}`, {}], groups[1]]
  },
  Nesting.FRAME,
  '',
  undefined as unknown as SubElement[],
  Display.BLOCK,
)

export const Blockquote = block(Nesting.POST)(function blockquote(text: string, opts?: BlockOptions): Tag {
  return [['blockquote', {}], text]
})

export const Code = block(Nesting.NONE, [])(function code(text: string, opts?: BlockOptions): Tag {
  return [['pre', {}], [['code', {}], text]]
})

export const HorizontalRule = block(Nesting.NONE, [])(function horizontalRule(): Tag {
  return [['hr', {}]]
})

// SideBySide: columns separated by `|` on each line
export const SideBySide = block(Nesting.POST)(function sideBySide(text: string, opts?: BlockOptions): Tag {
  const lines = text.split('\n')
  const columns = R.transpose(lines.map(l => l.split('|')))
  const cols = columns.map(col => [['div', { style: { flex: '1' } }], col.join('\n')] as Tag)
  return [['div.side-by-side', { style: { display: 'flex' } }], ...cols]
})

export const Paragraphs = block(Nesting.SUB)(function paragraphs(text: string): Tag {
  const paras = text.split('\n\n').map(x => {
    const trimmed = x.trim()
    if (trimmed.startsWith('[|')) return trimmed
    return [['p', {}], trimmed] as Tag
  })
  return [['div.paragraphs', {}], ...paras]
})

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

/**
 * Standard inline elements registry.
 * Underline comes before Italic so `__text__` matches Underline, `_text_` matches Italic.
 */
export const StandardInline: Registry = new Registry().add(
  Underline,    // must come before Italic
  Bold,
  Italic,
  Monospace,
  Strikethrough,
  Superscript,
  Subscript,
  Link,
  InlineImage,
  Tooltip,
)

/**
 * Standard registry: all inline + block elements.
 */
export const Standard: Registry = new Registry().add(
  // Inlines (same ordering as StandardInline)
  Underline,
  Bold,
  Italic,
  Monospace,
  Strikethrough,
  Superscript,
  Subscript,
  Link,
  InlineImage,
  Tooltip,
  Header,
  // Blocks
  Paragraphs,
  Blockquote,
  Code,
  HorizontalRule,
  SideBySide,
)
