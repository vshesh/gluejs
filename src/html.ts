import { isLeaf } from './nestable'
import type { Tag } from './parser'

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Parse shorthand like `div#id.class1.class2` into { tag, id, classes }.
 * Handles any ordering of `#id` and `.class` segments.
 */
function parseShorthand(shorthand: string): { tag: string; id?: string; classes: string[] } {
  // Split on # and . keeping the delimiter so we can tell them apart
  const parts = shorthand.split(/(?=[#.])/)
  const tag = parts[0]
  let id: string | undefined
  const classes: string[] = []
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i]
    if (p.startsWith('#')) id = p.slice(1)
    else if (p.startsWith('.')) classes.push(p.slice(1))
  }
  return { tag, id, classes }
}

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, m => '-' + m.toLowerCase())
}

function serializeStyle(style: { [k: string]: string | number | boolean }): string {
  return Object.entries(style)
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join(';')
}

function renderAttrs(shorthandClasses: string[], shorthandId: string | undefined, attrs: { [k: string]: any }): string {
  const parts: string[] = []

  // id: explicit attr wins over shorthand
  const id = attrs.id != null ? attrs.id : shorthandId
  if (id != null) parts.push(`id="${escapeHtml(String(id))}"`)

  // class: merge shorthand and explicit
  const explicitClass = attrs.class ? String(attrs.class).split(/\s+/) : []
  const allClasses = [...shorthandClasses, ...explicitClass]
  if (allClasses.length > 0) parts.push(`class="${allClasses.join(' ')}"`)

  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'id' || key === 'class') continue
    if (key === 'style' && typeof val === 'object' && val !== null) {
      parts.push(`style="${serializeStyle(val)}"`)
    } else if (val === true) {
      parts.push(key)
    } else if (val === false || val == null) {
      // omit
    } else {
      parts.push(`${key}="${escapeHtml(String(val))}"`)
    }
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : ''
}

/**
 * Render a Tag tree (or plain string) to an HTML string.
 */
export function render(node: Tag | string): string {
  if (typeof node === 'string') return escapeHtml(node)
  if (isLeaf(node)) return escapeHtml(node as unknown as string)

  const head = node[0] as [string, { [k: string]: any }]
  const [shorthand, attrs] = head
  const { tag, id, classes } = parseShorthand(shorthand)
  const attrStr = renderAttrs(classes, id, attrs)
  const children = (node as any[]).slice(1)

  if (VOID_TAGS.has(tag)) {
    return `<${tag}${attrStr}>`
  }

  const inner = children.map((child: any) => render(child)).join('')
  return `<${tag}${attrStr}>${inner}</${tag}>`
}
