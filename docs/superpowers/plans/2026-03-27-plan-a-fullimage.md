# Plan A: Add FullImage Element

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Add `FullImage` — a `!![alt](url)` block-level image — to `src/library.ts` and both Standard registries.

**Architecture:** Uses the existing `link` helper with `!!` prefix and `Nesting.NONE`. Prefix `!!` is distinct from existing `!` (InlineImage).

**Tech Stack:** TypeScript, vitest.

---

### Task: Add FullImage to library.ts

**Files:**
- Modify: `src/library.ts`
- Modify: `src/__tests__/library.test.ts`

- [ ] **Step 1: Write the failing test** in `src/__tests__/library.test.ts`

Find the block that imports from `../library` and add `FullImage` to the import. Then add a new describe block:

```typescript
import { ..., FullImage, Standard, StandardExtended } from '../library'

describe('FullImage', () => {
  it('renders !![alt](url) as a block-level img', () => {
    const html = render(parse(Standard, [{ name: 'paragraphs', args: '' }, '!![alt text](https://example.com/img.png)']))
    expect(html).toContain('<img')
    expect(html).toContain('alt="alt text"')
    expect(html).toContain('src="https://example.com/img.png"')
    expect(html).toContain('display')
  })

  it('is included in Standard registry', () => {
    expect(Standard.has('full-image')).toBe(true)
  })

  it('is included in StandardExtended registry', () => {
    expect(StandardExtended.has('full-image')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
rtk npm test -- src/__tests__/library.test.ts 2>&1 | tail -15
```

Expected: FAIL — `FullImage` not exported, `full-image` not in registry.

- [ ] **Step 3: Add FullImage to src/library.ts**

After the `InlineImage` definition, add:

```typescript
export const FullImage = linkHelper('!!', Nesting.NONE)(function fullImage(groups): Tag {
  return [['img', {
    alt: groups[0],
    src: groups[1],
    style: { display: 'block', margin: '0 auto', maxWidth: '100%' },
  }]]
})
```

Then add `FullImage` to `Standard` (after `InlineImage`):

```typescript
export const Standard: Registry = new Registry().add(
  Underline,
  Bold,
  Italic,
  Monospace,
  Strikethrough,
  Superscript,
  Subscript,
  Link,
  InlineImage,
  FullImage,    // ← add
  Tooltip,
  Header,
  Paragraphs,
  Blockquote,
  Code,
  HorizontalRule,
  SideBySide,
)
```

And in `StandardExtended`, add `FullImage` after `InlineImage` in the standard inlines block.

- [ ] **Step 4: Run tests — expect to pass**

```bash
rtk npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
rtk git add src/library.ts src/__tests__/library.test.ts
rtk git commit -m "feat: add FullImage element (!![alt](url) → block-level image)"
```
