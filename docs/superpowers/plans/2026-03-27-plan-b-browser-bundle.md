# Plan B: Browser Bundle + renderAll

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build `docs/glue.js` — an IIFE browser bundle that exposes `window.Glue` with a `renderAll()` function that processes `<script type="glue">` elements.

**Architecture:** `src/browser.ts` is the entry point. A separate `tsup.browser.config.ts` builds it as IIFE into `docs/`. `renderAll(options?)` is KaTeX-style: exported but not called automatically.

**Tech Stack:** TypeScript, tsup, vitest + jsdom.

**Prerequisite:** Plan A (FullImage element) must be complete before this plan.

---

### Task 1: tsup browser config + src/browser.ts

**Files:**
- Create: `tsup.browser.config.ts`
- Create: `src/browser.ts`
- Modify: `package.json`

- [ ] **Step 1.1: Create `tsup.browser.config.ts`**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { glue: 'src/browser.ts' },
  format: ['iife'],
  globalName: 'Glue',
  outDir: 'docs',
  clean: false,
  minify: false,
  sourcemap: false,
  outExtension: () => ({ js: '.js' }),
})
```

- [ ] **Step 1.2: Create `src/browser.ts`**

```typescript
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
```

- [ ] **Step 1.3: Add `build:docs` script to package.json**

In the `"scripts"` object:
```json
"build:docs": "tsup --config tsup.browser.config.ts"
```

---

### Task 2: renderAll tests

**Files:**
- Create: `src/__tests__/browser.test.ts`

- [ ] **Step 2.1: Write the failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderAll } from '../browser'
import { Standard } from '../library'

describe('renderAll', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
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
})
```

- [ ] **Step 2.2: Run tests — expect all to pass**

```bash
rtk npm test -- src/__tests__/browser.test.ts 2>&1 | tail -15
```

Expected: 5 tests pass.

- [ ] **Step 2.3: Run full suite**

```bash
rtk npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 2.4: Commit**

```bash
rtk git add src/browser.ts src/__tests__/browser.test.ts tsup.browser.config.ts package.json
rtk git commit -m "feat: browser bundle entry point with renderAll()"
```

---

### Task 3: Build the browser bundle

- [ ] **Step 3.1: Run build:docs**

```bash
rtk npm run build:docs 2>&1
```

Expected: `docs/glue.js` created, no errors.

- [ ] **Step 3.2: Verify Glue global is present**

```bash
rtk rg -c "Glue" docs/glue.js
```

Expected: nonzero.

- [ ] **Step 3.3: Commit the built bundle**

```bash
rtk git add docs/glue.js
rtk git commit -m "build: add browser bundle docs/glue.js"
```
