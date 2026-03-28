# Plan C: docs/index.html

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Write `docs/index.html` — a four-section Glue documentation page that renders itself using `<script type="glue">` blocks.

**Architecture:** Static HTML shell with nav, four `<section>` elements each containing a `<script type="glue">` block. Loads `glue.js` and calls `Glue.renderAll()` on DOMContentLoaded.

**Tech Stack:** Vanilla HTML/CSS, the `docs/glue.js` bundle from Plan B.

**Prerequisite:** Plans A and B must be complete. `docs/glue.js` must exist.

---

### Task: Write docs/index.html

**Files:**
- Create: `docs/index.html`

- [ ] **Step 1: Create docs/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Glue — extensible markup for the web</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #222;
      max-width: 860px;
      margin: 0 auto;
      padding: 0 1.5rem 4rem;
    }
    nav {
      position: sticky; top: 0; background: #fff;
      border-bottom: 1px solid #eee;
      padding: 0.75rem 0;
      display: flex; gap: 1.5rem;
      font-weight: 600; z-index: 100;
    }
    nav a { text-decoration: none; color: #555; }
    nav a:hover { color: #000; }
    nav .brand { color: #000; font-size: 1.1em; }
    section { padding-top: 3rem; }
    h1, h2, h3 { margin-top: 2rem; margin-bottom: 0.5rem; }
    p { margin: 0.75rem 0; }
    a { color: #0066cc; }
    pre { background: #f5f5f5; border-radius: 4px; padding: 1rem; overflow-x: auto; }
    code { font-family: 'Fira Code', monospace; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote {
      margin: 1rem 0; padding: 0.5rem 0 0.5rem 1rem;
      border-left: 4px solid #ccc; color: #555;
    }
    .side-by-side { gap: 1rem; }
    ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
    li { margin: 0.25rem 0; }
    hr { border: none; border-top: 1px solid #eee; margin: 2rem 0; }
    ins { background: #d4edda; text-decoration: none; }
    del { background: #f8d7da; }
    mark { background: #fff3cd; }
    .critic.comment { color: #666; font-style: italic; }
    sup, sub { font-size: 0.75em; }
    [title] { border-bottom: 1px dotted #888; cursor: help; }
  </style>
</head>
<body>

<nav>
  <a class="brand" href="#intro">Glue</a>
  <a href="#intro">Intro</a>
  <a href="#tour">Tour</a>
  <a href="#anatomy">Anatomy</a>
  <a href="#api">API</a>
</nav>

<section id="intro">
<script type="glue">
# Glue

*Glue* is an extensible markup language designed for the web. Unlike Markdown — which is
fixed and requires forking to add new syntax — Glue is built around a _Registry_: a
composable bag of inline and block elements you assemble to fit your document's needs.

---blockquote
"A plain-text format for other plain-text formats."
...

## How It Works

Inline elements look familiar: `*bold*`, `_italic_`, `` `monospace` ``, `__underline__`, `~strike~`.

Block elements use YAML document syntax:

---code
---blockquote
This text renders as a blockquote.
...
...

## This Page

This documentation page is itself a Glue document. Each section is a `<script type="glue">`
block parsed and rendered in the browser by the *glue.js* bundle.

To use Glue in your own page:

---code html
<script src="glue.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => Glue.renderAll())
</script>

<script type="glue">
*Hello*, _world_!
</script>
...
</script>
</section>

<section id="tour">
<script type="glue">
# Tour of the Standard Registry

The `StandardExtended` registry (used by default in `renderAll`) includes all elements below.

## Inline Elements

*Bold* `*like this*`. _Italic_ `_like this_`. `Monospace` `` `like this` ``.
__Underline__ `__like this__`. ~Strikethrough~ `~like this~`.

Superscripts: E = mc^{2}. Subscripts: H_{2}O.

Links: [Glue on GitHub](https://github.com/vshesh/gluejs).
Tooltips: T[hover over me](I am a tooltip).

## Headers

Six levels, same as Markdown — `# H1` through `###### H6`.

## Blockquote

---blockquote
Happiness is a warm codebase.
...

## Code

---code javascript
function greet(name) {
  return `Hello, ${name}!`
}
...

## Side by Side

Columns are separated by `|`. Each column is parsed independently.

---side-by-side
*Left column* with _inline_ markup.
| *Right column* — independent from the left.
...

## Lists

---unordered-list
- Unordered item one
- Unordered item two
- Unordered item three
...

---ordered-list
1. First step
2. Second step
3. Third step
...

## Horizontal Rule

---horizontal-rule
...

## CriticMarkup

{++Added text++}. {--Deleted text--}. {==Highlighted text==}.
{~~old~>new~~}. {>>This is a comment<<}.
</script>
</section>

<section id="anatomy">
<script type="glue">
# Anatomy of an Element

Every element in a Registry is either a _Block_ or an _Inline_.

## Inline Elements

An inline element wraps a span of text. The simplest kind uses `IdenticalInline`:

---code typescript
import { IdenticalInline } from 'gluejs'

export const Bold = IdenticalInline('bold', '*', 'strong')
export const Italic = IdenticalInline('italic', '_', 'em')
...

For full control, use the `inline` factory:

---code typescript
import { inline, Nesting } from 'gluejs'

export const Bold = inline(
  /(?<!\\)\*(.+?)(?<!\\)\*/,
  function bold(groups) {
    return [['strong', {}], groups[0]]
  },
  Nesting.FRAME
)
...

## Block Elements

A block processes text between `---name` and `...`. Use the `block` decorator:

---code typescript
import { block, Nesting } from 'gluejs'

export const Blockquote = block(Nesting.POST)(function blockquote(text) {
  return [['blockquote', {}], text]
})
...

`Nesting.POST` parses inline elements inside the block after the block runs.
`Nesting.NONE` is for terminal elements (code, math) — content is verbatim.
`Nesting.SUB` pre-parses sub-blocks before the block sees the text.

## Registries

Compose elements into a Registry and parse:

---code typescript
import { Registry, parse, render } from 'gluejs'
import { Bold, Italic, Paragraphs } from 'gluejs/library'

const reg = new Registry().add(Bold, Italic, Paragraphs)
const html = render(parse(reg, [{ name: 'paragraphs', args: '' }, text]))
...
</script>
</section>

<section id="api">
<script type="glue">
# API Reference

## parse(registry, ast)

Parses a Glue AST node. For a full document, pass a two-element array:

---code typescript
const tag = parse(registry, [{ name: 'paragraphs', args: '' }, documentText])
...

## render(tag)

Converts a parsed `Tag` tree to an HTML string.

---code typescript
const html = render(tag)  // '<div class="paragraphs"><p>...</p></div>'
...

## Glue.renderAll(options?)

Browser-only. Finds `<script type="glue">` elements and renders them in place.

---code typescript
Glue.renderAll({
  registry: Glue.Standard,          // default: StandardExtended
  top: 'paragraphs',                // default: 'paragraphs'
  selector: 'script[type="glue"]',  // default
})
...

## Registries

---side-by-side
`Standard`

Bold, Italic, Monospace, Underline, Strikethrough, Superscript, Subscript,
Link, InlineImage, FullImage, Tooltip, Header, Paragraphs, Blockquote,
Code, HorizontalRule, SideBySide.
| `StandardExtended`

Everything in `Standard`, plus CriticMarkup (CriticAdd, CriticDel,
CriticHighlight, CriticComment, CriticSub), UnorderedList, OrderedList.

## Element Helpers

`IdenticalInline(name, delim, tag)` — symmetric inline like `*bold*`.

`MirrorInline(name, open, tag)` — mirrored inline like `{++ins++}`.

`SingleGroupInline(name, open, close, tag)` — asymmetric inline like `^{sup}`.

`block(nest?, sub?)(fn)` — decorator for block elements.

`inline(regex, fn, nest?, escape?, sub?, display?)` — factory for inline elements.

`link(prefix, nest?)(fn)` — factory for `PREFIX[text](url)` patterns.
</script>
</section>

<script src="glue.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    Glue.renderAll()
  })
</script>
</body>
</html>
```

- [ ] **Step 2: Verify block names resolve**

```bash
rtk node -e "
const lib = require('./dist/index.cjs')
const names = [...lib.StandardExtended.keys()]
const needed = ['paragraphs','blockquote','code','horizontal-rule','side-by-side','unordered-list','ordered-list']
const missing = needed.filter(n => !names.includes(n))
console.log('missing:', missing.length ? missing : 'none')
console.log('all names:', names.join(', '))
"
```

Expected: `missing: none`. If any are missing, fix the block name in `index.html` to match what the registry actually uses (the element name is derived from the function name — `horizontalRule` → `horizontal-rule`).

- [ ] **Step 3: Open in browser and verify**

```bash
open docs/index.html
```

Check:
- All four sections render (Intro, Tour, Anatomy, API)
- Bold/italic/code inline styles work
- Blockquote, code block, side-by-side, lists render
- CriticMarkup colors appear (ins=green, del=red, mark=yellow)
- No JS errors in console

- [ ] **Step 4: Commit**

```bash
rtk git add docs/index.html
rtk git commit -m "docs: add browser docs site (four sections, script type=glue)"
```

---

### Task: Configure GitHub Pages

- [ ] **Step 5: Push to GitHub**

```bash
rtk git push
```

- [ ] **Step 6: Enable GitHub Pages**

In the repository on GitHub: Settings → Pages → Source: Deploy from branch → Branch: `main`, Folder: `/docs` → Save.

The site will be live at `https://<owner>.github.io/gluejs/` within a few minutes.
