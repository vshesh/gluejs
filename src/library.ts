import {
  block, inline, inline_two, link as linkHelper, terminal_block,
  IdenticalInline, SingleGroupInline, MirrorInline,
  Nesting, Display, Patterns, AssetType,
  assetUrl, assetInline,
  type BlockOptions,
} from './elements'
import type { Tag } from './parser'
import { Registry } from './parser'
import { slug, zipLongest, splitUnescaped, parseYaml } from './util'

function pos(opts: BlockOptions | undefined, i = 0, fallback = ''): string {
  const v = opts?._
  const item = Array.isArray(v) ? v[i] : undefined
  return item == null || item === '' ? fallback : String(item)
}

function componentTag(name: string, props: unknown): Tag {
  const obj = (props && typeof props === 'object' && !Array.isArray(props) ? props : {}) as Record<string, unknown>
  const attrs: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(obj)) {
    attrs[k] = v != null && typeof v === 'object' ? JSON.stringify(v) : v as string | number | boolean
  }
  return [[name, attrs]]
}

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
  const href = groups[1]
  return [['a', { href, target: href.startsWith('http') ? '_blank' : '_self' }], groups[0]]
})

export const FullImage = linkHelper('!!', Nesting.NONE)(function fullImage(groups): Tag {
  return [['img.full-image', {
    alt: groups[0], src: groups[1],
    style: { display: 'block', margin: '0 auto', maxWidth: '100%' },
  }]]
})

export const InlineImage = linkHelper('!', Nesting.NONE)(function inlineImage(groups): Tag {
  return [['img.inline-image', { alt: groups[0], src: groups[1], style: { display: 'inline-block', verticalAlign: 'middle', maxWidth: '100%' } }]]
})

export const Classed = linkHelper('\\.', Nesting.POST)(function classed(groups): Tag {
  return [['span', { class: groups[0] }], groups[1]]
})

export const TagBasic = inline(Patterns.tag_simple, function tagBasic(groups: string[]): Tag {
  return [[groups[0] + (groups[1] || ''), {}], groups[2]]
}, Nesting.POST)

export const TagAttributes = inline(Patterns.tag_attributes, function tagAttributes(groups: string[]): Tag {
  const attrs: Record<string, string> = {}
  for (const m of groups[2].matchAll(/([a-zA-Z]+)="([^"]+)"/g)) attrs[m[1]] = m[2]
  return [[groups[0] + (groups[1] || ''), attrs], groups[3]]
}, Nesting.POST)

export const Audio = inline(
  /@\{([^}]+)\}/,
  function audio(groups: string[]): Tag {
    return [['audio', { controls: true, src: groups[0] }], 'Audio is not supported on your browser.']
  },
  Nesting.NONE, '@', [],
)

// Header as Display.BLOCK — `^`/`$` are line anchors (combined inline regex uses `m`)
export const Header = inline(
  /^(#{1,6})([^\n]*)$/,
  function header(groups: string[]): Tag {
    const title = groups[1].trimStart()
    return [[`h${groups[0].length}`, {}], [['a.anchor', { id: slug(groups[1]) }], title]]
  },
  Nesting.POST, '#', ['all'], Display.BLOCK,
)

export const MDStarBold = MirrorInline('mdStarBold', '**', 'strong')
export const MDLodashBold = MirrorInline('mdLodashBold', '__', 'strong')
export const MDStarItalic = MirrorInline('mdStarItalic', '*', 'em')
export const MDLodashItalic = MirrorInline('mdLodashItalic', '_', 'em')

// ---------------------------------------------------------------------------
// Block elements
// ---------------------------------------------------------------------------

export const NoopBlock = block()(function noopBlock(text: string): Tag {
  return [['div', {}], text]
})

export const Paragraphs = block(Nesting.SUB)(function paragraphs(text: string): Tag {
  const paras: (string | Tag)[] = []
  for (const chunk of text.split(/(?:^|\n)(\[\|\|\d+\|\|\])/m)) {
    if (!chunk) continue
    if (/^\[\|\|\d+\|\|\]$/.test(chunk.trim())) {
      paras.push(chunk.trim())
      continue
    }
    for (const p of chunk.split('\n\n')) {
      const trimmed = p.trim()
      if (!trimmed) continue
      paras.push([['p', {}], trimmed] as Tag)
    }
  }
  return [['div.paragraphs', {}], ...paras]
})

function restyle(tag: Tag, name: string): Tag {
  const [, attrs] = tag[0] as [string, object]
  return [[name, attrs], ...tag.slice(1)] as Tag
}

export const Aside = block(Nesting.SUB)(function aside(text: string): Tag {
  return restyle(Paragraphs.parse(text), 'aside')
})

const HLJS = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build'
const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist'

const PDFOBJECT = 'https://cdnjs.cloudflare.com/ajax/libs/pdfobject/2.2.12/pdfobject.min.js'
const ABCJS = 'https://cdn.jsdelivr.net/npm/abcjs@6.5.2/dist/abcjs-basic.min.js'

function guitarChordSvg(text: string): Tag {
  const info = (parseYaml(text) ?? {}) as Record<string, unknown>
  const frets = String(info.fret ?? 'x x x x x x').trim().split(/\s+/)
  const labels = String(info.label ?? '').trim().split(/\s+/)
  const title = String(info.title ?? '')
  const n = Math.max(frets.length, 6)
  const vals = Array.from({ length: n }, (_, i) => {
    const f = frets[i] ?? 'x'
    return /^(x|X)$/.test(f) ? -1 : Number(f)
  })
  const played = vals.filter(v => v > 0)
  const hi = played.length ? Math.max(...played) : 4
  const lo = played.length ? Math.min(...played) : 1
  const base = hi <= 4 ? 1 : lo
  const rows = Math.max(4, hi - base + 1)
  const pad = 18, gap = 16
  const W = pad * 2 + (n - 1) * gap
  const H = 28 + pad + rows * gap
  const kids: Tag[] = []
  if (title) kids.push([['text', { x: W / 2, y: 14, 'text-anchor': 'middle', 'font-size': 12 }], title])
  if (base === 1) {
    kids.push([['rect', { x: pad - 1, y: pad - 2, width: (n - 1) * gap + 2, height: 4, fill: 'black' }]])
  } else {
    kids.push([['text', { x: pad - 12, y: pad + 12, 'font-size': 10 }], String(base)])
  }
  const grid: Tag[] = []
  for (let s = 0; s < n; s++) {
    const x = pad + s * gap
    grid.push([['line.grid', { x1: x, y1: pad, x2: x, y2: pad + rows * gap }]])
  }
  for (let r = 0; r <= rows; r++) {
    const y = pad + r * gap
    grid.push([['line.grid', { x1: pad, y1: y, x2: pad + (n - 1) * gap, y2: y }]])
  }
  kids.push([['g.grid', {}], ...grid])
  vals.forEach((v, s) => {
    const x = pad + s * gap
    if (v < 0) kids.push([['text', { x, y: pad - 6, 'text-anchor': 'middle', 'font-size': 10 }], 'x'])
    else if (v === 0) kids.push([['circle', { cx: x, cy: pad - 6, r: 3, fill: 'none', stroke: 'black' }]])
    else {
      const y = pad + (v - base + 0.5) * gap
      kids.push([['circle', { cx: x, cy: y, r: 5, fill: 'black' }]])
      const lab = labels[s]
      if (lab && lab !== 'x') kids.push([['text.labels', { x, y: y + 3, 'text-anchor': 'middle', 'font-size': 8 }], lab])
    }
  })
  return [['svg.chordChart', {
    viewBox: `0 0 ${W} ${H}`, width: W, height: H, xmlns: 'http://www.w3.org/2000/svg',
  }], ...kids]
}

/** Decorated like the python library: `@asset_*` on the constructed element. */
class Std {
  @assetInline(AssetType.CSS, `.tooltip {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}
.tooltip .tooltip-text {
  visibility: hidden;
  min-width: 100%;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-5px);
}
.tooltip:hover .tooltip-text { visibility: visible; }`)
  static Tooltip = linkHelper('T', Nesting.POST)(function tooltip(groups): Tag {
    return [['span.tooltip', {}], groups[0], [['div.tooltip-text', {}], groups[1]]]
  })

  @assetInline(AssetType.JS, `globalThis.Link = {
  view: ({attrs: {href, text}}) => m(m.route.Link, {href}, text)
}`)
  static MithrilLink = linkHelper('M')(function mithrilLink(groups): Tag {
    return [['Link', { href: groups[1], text: groups[0] }]]
  })

  @assetInline(AssetType.CSS, `.pictogram { position: relative; }
.pictogram > img { max-height: 1.5em; position: relative; top: 0.45em; }
.pictogram > span.pictoword {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.4); color: white; display: none; font-size: 75%;
}
.pictogram:hover > .pictoword { display: inline; }`)
  static Pictogram = linkHelper('P')(function pictogram(groups): Tag {
    return [['span.pictogram', {}],
      [['img', { alt: groups[0], src: groups[1] || `/img/pictogram/${groups[0]}.png` }]],
      [['span.pictoword', {}], groups[0]]]
  })

  @assetInline(AssetType.CSS, `@media only screen and (min-width: 750px) {
  p.stacked { white-space: nowrap; text-align: center; }
  p.stacked span { vertical-align: middle; }
  p.stacked .stack { display: inline-flex; flex-direction: column; margin: 0 0.5em; }
  p.stacked .stack span { text-align: center; font-weight: 500; }
}
@media only screen and (max-width: 750px) {
  p.stacked .stack span::after { content: ", "; }
  p.stacked .stack span:last-child::after,
  p.stacked .stack span:first-child::before { content: " "; }
  p.stacked .stack span:last-child::before { content: "and"; }
}`)
  static Stacked = block()(function stacked(text: string): Tag {
    return [['p.stacked', {}], ...text.split('\n').map(line =>
      line.startsWith('$#')
        ? [['span.stack', {}], ...line.slice(2).split(',').map(p => [['span', {}], p] as Tag)] as Tag
        : [['span', {}], line] as Tag
    )]
  })

  @assetInline(AssetType.CSS, `blockquote {
  margin-left: 10px;
  padding-left: 5px;
  font-size: 1.15em;
  border-left: 5px solid gray;
}`)
  static Blockquote = block(Nesting.SUB)(function blockquote(text: string): Tag {
    return restyle(Paragraphs.parse(text), 'blockquote')
  })

  @assetUrl(AssetType.CSS, `${HLJS}/styles/atom-one-light.min.css`)
  @assetUrl(AssetType.JS, `${HLJS}/highlight.min.js`)
  static Code = terminal_block()(function code(text: string, opts?: BlockOptions): Tag {
    const lang = String(opts?.language ?? pos(opts, 0, ''))
    return [['pre', {}], [[`code${lang ? '.language-' + lang : ''}`, {}], text]]
  })

  @assetInline(AssetType.CSS, '.matrix { margin: 0 auto; }')
  static Matrix = block(Nesting.POST)(function matrix(text: string, opts?: BlockOptions): Tag {
    const type = String(opts?.type ?? pos(opts, 0, 'flex'))
    const flex = type === 'flex'
    const rows = text.split('\n').filter(l => l.trim() !== '').map(l => {
      const cells = splitUnescaped(l, '|').map(c =>
        [[flex ? 'span' : 'td', flex ? { style: { flex: 1 } } : {}], c] as Tag)
      return [[flex ? 'div' : 'tr', flex ? { style: { display: 'flex' } } : {}], ...cells] as Tag
    })
    return [[flex ? 'div.matrix.matrix-flex' : 'table.matrix.matrix-table', {}], ...rows]
  })

  @assetInline(AssetType.CSS, `.video {
  position: relative;
  padding-bottom: 56.25%;
  padding-top: 30px;
  height: 0;
  overflow: hidden;
}
.video iframe, .video object, .video embed {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
}`)
  static Youtube = terminal_block()(function youtube(url: string): Tag {
    return [['div.video', {}], [['iframe', {
      src: url.trim(), frameborder: '0',
      allow: 'encrypted-media; picture-in-picture', allowfullscreen: true,
    }]]]
  })

  @assetUrl(AssetType.CSS, `${KATEX}/katex.min.css`)
  @assetUrl(AssetType.JS, `${KATEX}/katex.min.js`)
  @assetInline(AssetType.CSS, '.katex { position: relative; }')
  static Katex = terminal_block()(function katex(text: string): Tag {
    return [['div.katex', {}], text]
  })

  @assetUrl(AssetType.JS, 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js')
  static Mermaid = terminal_block()(function mermaid(text: string): Tag {
    return [['div.mermaid', {}], text]
  })

  @assetInline(AssetType.CSS, `.slideshow{width:100%;position:relative;text-align:center}
.slideshow--item{width:100%;line-height:1.5;display:none}
.slideshow--item img{width:100%;display:inherit}
.slideshow--item::after{content:attr(data-pos);position:absolute;color:white;top:0.25em;right:0.5em;padding:0.1em}
.slideshow--bullet:checked + .slideshow--item{display:block}
.slideshow[data-transition="fade"] .slideshow--item{opacity:0;transition:0.3s ease-out opacity}
.slideshow[data-transition="fade"] .slideshow--bullet:checked + .slideshow--item{opacity:1}
.slideshow--nav{position:absolute;top:0;bottom:0;width:50%;display:none;z-index:88;cursor:pointer;color:transparent;user-select:none}
.slideshow--nav:after{display:block;content:'\\25B6';font-size:2em;color:#fff;position:absolute;top:50%;right:10px;margin-top:-.5em}
.slideshow--nav-previous{left:0;display:block}
.slideshow--nav-previous:after{transform:scaleX(-1);right:auto;left:10px}
.slideshow--nav-next{left:50%;display:block}
.slideshow--bullet{display:none}
.slideshow--caption{width:100%;color:white;background:#000a;padding:0.25em 0}`)
  static Slideshow = terminal_block()(function slideshow(text: string): Tag {
    const lines = text.split('\n').filter(l => l.trim() !== '')
    if (!lines.length) return [['div.slideshow', { 'data-transition': 'fade' }]]
    const name = 'ss-' + Math.random().toString(36).slice(2)
    const kids: Tag[] = []
    lines.forEach((line, i) => {
      const [src, caption = ''] = line.split('::')
      const prev = (i - 1 + lines.length) % lines.length
      const next = (i + 1) % lines.length
      kids.push([['input.slideshow--bullet', {
        type: 'radio', name, id: `${name}-item-${i}`, checked: i === 0,
      }]])
      kids.push([['div.slideshow--item', { 'data-pos': `${i + 1}/${lines.length}` }],
        [['img', { src: src.trim() }]],
        [['div.slideshow--caption', {}], caption],
        [['label.slideshow--nav.slideshow--nav-previous', { for: `${name}-item-${prev}` }], `Go to slide ${prev + 1}`],
        [['label.slideshow--nav.slideshow--nav-next', { for: `${name}-item-${next}` }], `Go to slide ${next + 1}`],
      ])
    })
    return [['div.slideshow', { 'data-transition': 'fade' }], ...kids]
  })

  @assetInline(AssetType.CSS, '.pdfobject-container { height: 30rem; border: 1rem solid rgba(0,0,0,.1); }')
  @assetUrl(AssetType.JS, PDFOBJECT)
  static PdfObject = terminal_block()(function pdfObject(text: string): Tag {
    return [['div.pdf-object.pdfobject-container', {}], text.trim()]
  })

  @assetInline(AssetType.CSS, `.annotated-code .code-box { display: flex; }
.annotated-code .code-box > pre { flex: 1; margin: 0; }
.annotated-code .code-box pre:first-child { flex: 0; padding-top: 0.5em; }
.annotated-code .code-box pre:first-child span { padding: 0 3px; }
.annotated-code .code-box pre:first-child span:hover { background-color: black; color: white; }`)
  static AnnotatedCode = terminal_block()(function annotatedCode(text: string, opts?: BlockOptions): Tag {
    const language = String(opts?.language ?? pos(opts, 0, 'python'))
    const comment = String(opts?.comment ?? pos(opts, 1, '#'))
    let total = 0, code = '', annotation = ''
    const annotations: Record<number, string> = {}
    text.split('\n').forEach((line, num) => {
      if (line.trimStart().startsWith(comment)) {
        total++
        const a = line.trimStart().slice(comment.length).trimStart()
        if (a.trim()) annotation += a + '\n'
      } else {
        code += line + '\n'
        if (annotation) {
          annotations[num - total] = annotation
          annotation = ''
        }
      }
    })
    const body = code.replace(/\n$/, '')
    const codeLines = body.split('\n')
    const nums: Tag[] = codeLines.map((l, i) =>
      [['span', { title: (annotations[i] ?? '').trim() }], String(i + 1)])
    return [['div.annotated-code', {}],
      [['div.code-box', {}],
        [['pre', {}], ...nums],
        [['pre', {}], [[`code.language-${language}`, {}], body]]]]
  })

  @assetInline(AssetType.CSS, `.chordChart g.grid { stroke: black; stroke-width: 1px; }
.chordChart text.labels { fill: white; }`)
  static GuitarChord = terminal_block()(function guitarChord(text: string): Tag {
    return guitarChordSvg(text)
  })

  @assetInline(AssetType.JS, `function getStyleProp(elem, prop){
  if(window.getComputedStyle) return window.getComputedStyle(elem, null).getPropertyValue(prop);
  else if(elem.currentStyle) return elem.currentStyle[prop];
}
function setViewBox(selector) {
  var el = document.getElementById(selector);
  var height = parseFloat(getStyleProp(el, 'height'));
  var width = parseFloat(getStyleProp(el, 'width'));
  el.removeAttribute('style');
  var svg = el.firstChild;
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.removeAttribute("height");
  svg.removeAttribute("width");
}`)
  @assetUrl(AssetType.JS, ABCJS)
  static MusicalAbc = terminal_block()(function musicalAbc(text: string): Tag {
    return [['div.musical-abc', {}], text]
  })
}

export const {
  Tooltip, MithrilLink, Pictogram, Stacked, Blockquote, Code, Matrix, Youtube,
  Katex, Mermaid, Slideshow, PdfObject, AnnotatedCode, GuitarChord, MusicalAbc,
} = Std

export const HorizontalRule = terminal_block()(function horizontalRule(): Tag {
  return [['hr', {}]]
})

export const SideBySide = block(Nesting.POST)(function sideBySide(text: string): Tag {
  const rows = text.replace(/\n$/, '').split('\n').map(l => splitUnescaped(l, '|'))
  const cols = zipLongest(rows, '').map(col => [['div', { style: { flex: '1' } }], col.join('\n')] as Tag)
  return [['div.side-by-side', { style: { display: 'flex' } }], ...cols]
})

export const Figure = block(Nesting.POST)(function figure(text: string): Tag {
  const i = text.indexOf('\n\n')
  const [caption, body] = i < 0 ? [undefined, text] : [text.slice(0, i), text.slice(i + 2)]
  return [['figure', {}], body, ...(caption ? [[['figcaption', {}], caption] as Tag] : [])]
})

export const Video = terminal_block()(function video(url: string): Tag {
  return [['video', { controls: true }], [['source', { src: url.trim() }]], 'Your browser does not support the video tag.']
})

export const CodeBySide = block(Nesting.POST)(function codeBySide(text: string, opts?: BlockOptions): Tag {
  const language = String(opts?.language ?? pos(opts, 0, 'md'))
  return [['div', { style: { display: 'flex', alignItems: 'center' } }],
    [['div', { style: { flex: 1 } }], text],
    [['div', { style: { flex: 1 } }], `---code ${language}\n${text.replace(/\n$/, '')}\n...`]]
})

export const YamlComponent = terminal_block()(function yamlComponent(text: string, opts?: BlockOptions): Tag {
  return componentTag(String(opts?.name ?? pos(opts, 0, 'Component')), parseYaml(text))
})

export const JsonComponent = terminal_block()(function jsonComponent(text: string, opts?: BlockOptions): Tag {
  return componentTag(String(opts?.name ?? pos(opts, 0, 'Component')), JSON.parse(text || '{}'))
})

export const LiveYamlComponentDangerous = terminal_block()(function liveYamlComponentDangerous(text: string, opts?: BlockOptions): Tag {
  return componentTag('ℂ' + String(opts?.name ?? pos(opts, 0, 'Component')), parseYaml(text))
})

// ---------------------------------------------------------------------------
// Lists — indent-nested, optional markdown bullets. `-o` / ordered → <ol>
// ---------------------------------------------------------------------------

type ListTree = (string | ListTree)[]

function processList(l: ListTree, root: string): Tag {
  if (Array.isArray(l[0])) {
    throw new Error('Sublist found as first element of the list. Sublists must come after another list element.')
  }
  const acc: Tag = [[root, {}]]
  for (const e of l) {
    if (typeof e === 'string') acc.push([['li', {}], e])
    else (acc[acc.length - 1] as Tag).push(processList(e, root))
  }
  return acc
}

function parseListItems(text: string): ListTree | undefined {
  if (!text || text.trim() === '') return undefined
  const items: ListTree[] = []
  const pos = [-1]
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    const p = line.length - line.replace(/^ +/, '').length
    const content = line.trim().replace(/^([-*+]|\d+\.)\s+/, '')
    if (p > pos[pos.length - 1]) {
      items.push([content])
      pos.push(p)
    } else if (p < pos[pos.length - 1]) {
      while (p < pos[pos.length - 1]) {
        const item = items.pop()!
        ;(items[items.length - 1] as ListTree).push(item)
        pos.pop()
      }
      items[items.length - 1].push(content)
      if (pos[pos.length - 1] !== p) pos.push(p)
    } else {
      items[items.length - 1].push(content)
    }
  }
  while (items.length > 1) {
    items[items.length - 2].push(items[items.length - 1])
    items.pop()
  }
  return items[0]
}

function listTag(text: string, ordered: boolean): Tag {
  const items = parseListItems(text)
  if (!items) return [[ordered ? 'ol' : 'ul', {}]]
  return processList(items, ordered ? 'ol' : 'ul')
}

export const List = block(Nesting.POST, ['all'], { o: false })(function list(text: string, opts?: BlockOptions): Tag {
  return listTag(text, !!(opts?.o || (opts as { _?: string[] })?._?.[0] === 'o'))
})

export const UnorderedList = block(Nesting.POST)(function unorderedList(text: string): Tag {
  return listTag(text, false)
})

export const OrderedList = block(Nesting.POST)(function orderedList(text: string): Tag {
  return listTag(text, true)
})

// ---------------------------------------------------------------------------
// CriticMarkup
// ---------------------------------------------------------------------------

export const CriticAdd = MirrorInline('criticAdd', '{++', 'ins')
export const CriticDel = MirrorInline('criticDel', '{--', 'del')
export const CriticHighlight = MirrorInline('criticHighlight', '{==', 'mark')
export const CriticComment = MirrorInline('criticComment', '{>>', 'span.critic.comment')
export const CriticSub = inline_two('{~~', '~>', '~~}')(function criticSub(groups: string[]): Tag {
  return [['span.critic.sub', {}], [['del', {}], groups[0]], [['ins', {}], groups[1]]]
})

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

export const StandardInline: Registry = new Registry([
  Underline, Bold, Italic, Monospace, Strikethrough,
  Superscript, Subscript, TagBasic, TagAttributes, Classed, Stacked,
  Link, MithrilLink, FullImage, InlineImage, Pictogram, Tooltip, Audio, Header,
])

export const MarkdownInline: Registry = StandardInline
  .minus([Bold, Italic, Underline])
  .plus([MDStarBold, MDLodashBold, MDStarItalic, MDLodashItalic])

export const CriticMarkup: Registry = new Registry([
  CriticSub, CriticAdd, CriticDel, CriticComment, CriticHighlight,
])

export const Music: Registry = new Registry([GuitarChord, MusicalAbc])

const blocks = [
  Aside, Blockquote, List, UnorderedList, OrderedList,
  SideBySide, Matrix, Figure, Youtube, Video, Slideshow, PdfObject,
  Code, CodeBySide, HorizontalRule, Katex, Mermaid, NoopBlock,
  AnnotatedCode, YamlComponent, JsonComponent, LiveYamlComponentDangerous,
  GuitarChord, MusicalAbc,
]

export const Standard: Registry = new Registry([Paragraphs], { top: Paragraphs })
  .merge(StandardInline)
  .merge(CriticMarkup)
  .plus(blocks)

export const StandardExtended: Registry = Standard.clone()

export const Markdown: Registry = new Registry([Paragraphs], { top: Paragraphs })
  .merge(MarkdownInline)
  .merge(CriticMarkup)
  .plus(blocks)
