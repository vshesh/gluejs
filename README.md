# Glue: plain-text format for other plain-text formats

[![Coverage Status](https://coveralls.io/repos/github/vshesh/gluejs/badge.svg?branch=main)](https://coveralls.io/github/vshesh/glue?branch=main)

JS/TS port of the [original python implementation](https://github.com/vshesh/glue).
A small, fast parser you can drop in like markdown: `toHTML(source)` or `Glue.renderAll()` in the browser.
 

## Quickstart

```bash
npm install glue
```

```ts
import { toHTML, parse, render, Standard, Registry, IdenticalInline } from 'glue'

toHTML('Hello *world*')
// '<div class="paragraphs"><p>Hello <strong>world</strong></p></div>'

// custom dialect: start from Standard, drop italic, add your own
const Strike = IdenticalInline('strike', '~~', 's')
const Mine = Standard.minus(['italic']).plus([Strike])
toHTML('~~gone~~ and _not italic_', Mine)
```

In a page, the same way you'd use a markdown library:

```html
<div id="doc"># Hello *world*</div>
<script type="module">
  import { toHTML } from 'glue'
  document.getElementById('doc').innerHTML = toHTML(
    document.getElementById('doc').textContent
  )
</script>
```

Or the zero-build path — drop in the IIFE bundle and put source in `<script type="glue">`:

```html
<script src="glue.js"></script>
<script type="glue">
# Title
*bold* and _italic_
---blockquote
quoted
...
</script>
<script>document.addEventListener('DOMContentLoaded', () => Glue.renderAll())</script>
```

```ts
import { toHTML } from 'glue'
el.innerHTML = toHTML(source)
```


## Dream

Really flexible plain-text syntaxes that can be used to create any kind
of rich content. Also a way to extend this language over time so you can
continually improve the ability to express yourself.

### Web

fully extensible text, with custom react-components, and even forms!

```md
# Title

blah blah blah T[some text](tooltip!)

![alt](img url)

---mermaid
graph TD
A --> B
B --> C
C --> A
...

---katex
\sum_{k=0}^x \binom{x}{k} = 2^x
...

---annotated-image http://img.url/goes/here
5,6: Note the brush strokes here!
100,100: woohoo the end of the image!
...

---sidebyside
[link](goes here) | other column
---code python    | ---code julia
def f(x):         | function f(x)
  return 2*x      |  2x
| end
... | ...
...
note how i put more blocks in the columns! and how it doesn't need to line up!

---react-yaml ComponentName
prop1: [data, more, data]
prop2:
  x: 1
  y: 2
...


---form
Name: [text]
Age: [number]
Descr:
[textarea]
[checkbox] Agree to Terms
...
```

### Seamless Code/Docs (a la Rusthon/Mathematica Notebook/Jupyter)

```md
# Hilbert Curves for Rectangles

## L System

here, we'd like to be able to generate some order of an l system.
For that, we need to be able to replace the text easily, and we need to
replace many tokens at the same time:

---code python
def multireplace(rep, text):
  """
  Takes
  """
  r = dict((re.escape(k), v) for k, v in rep.items())
  pattern = re.compile("|".join(r.keys()))
  return pattern.sub(lambda m: r[re.escape(m.group(0))], text)
...

Now, functions that correspond to the hilbert curve.
---code python
def hilbert(order):
  s = 'L'
  for i in range(order):
    s = multireplace({'L':'+RF-LFL-FR+', 'R':'-LF+RFR+FL-'}, s)
  return re.sub(r'[LR]|(?:\+-)|(?:-\+)', '', s)

def movements(hilbert):
  plus = {'U': 'L', 'L': 'D', 'D': 'R', 'R': 'U'}
  minus = {'U': 'R', 'R': 'D', 'D': 'L', 'L': 'U'}
  
  m = []
  d = 'R'
  for e in hilbert.split('F'):
    n = d if e == '' else (plus if e == '+' else minus)[d]
    m.append((d, n))
    d = n
  return m
...

The movements gives us an array of the corners. Let's see if this maps
nicely onto a larger pattern or not!.

There's some mapping that requires us to think about how to flip the
original left and up patterns.

```

### Journal

```md
# 2015-05-02

Some free text about my experience of the morning.
I had cereal for breakfast. Again. I'm just too lazy to cook oatmeal.

## 12-1pm Lunch w/Nick at Lag
I had lunch with nick!
it was nice lunch too - we had this really good mexican food.

## 2-4pm Presentation for Class at 550 w/Sarah
The presentation went well...
@John was there too! I was surprised to see him.

!(/url/to/img)

etc
```

## Overview

This is a parser framework that specifically designed for plain-text.

At the risk of [that famous XKCD comic](https://xkcd.com/927/), I wrote this
small API for a parser-generator for plain-text based on regexes. Regexes can be
eeeeew, but they're a lot better than a lot of other things, and they seem
to be pretty standard across many parser applications (eg, syntax highlighters).
In order to remove *some* regex pain, I've written generators that will
help you write simple patterns that I imagine you will want to use. My
thinking is that these patterns account for 80% of the use cases you want. 

## How To Use

### Parse some text

`Standard` is a registry of markdown-like inline elements plus glue blocks (`---name` / `...`).

```ts
import { toHTML, parse, render, Standard } from 'glue'

toHTML('Hello *world*')              // string → HTML
render(parse(Standard, 'Hello *world*'))  // same thing, if you want the Tag tree
```

Inline:

- `*bold*` `_italic_` `` `code` `` `__underline__` `~strike~`
- `^{super}` `_{sub}` `[link](url)` `![img](url)` `!![full img](url)`
- `T[text](tooltip)` `{++add++}` `{--del--}` `{==mark==}` `{~~old~>new~~}`
- `#`–`######` headers

Blocks (YAML-document style):

```
---blockquote
quoted text, *inlines* work
...

---code javascript
const x = 1
...

---list
item
  nested
---list -o
one
two
...
```

Also: `aside`, `side-by-side`, `matrix`, `figure`, `katex`, `mermaid`, `youtube`, `video`, `horizontal-rule`.

### Customize a registry

A registry is a bag of `Element`s. Compose with `plus` / `minus` / `merge` (copies; `add`/`remove` mutate).

```ts
import { Standard, Italic, Registry, IdenticalInline } from 'glue'

const Mine = Standard.minus([Italic]).plus([IdenticalInline('wave', '~', 'em')])
```

`top` is the outermost block (usually `Paragraphs`). `parse(reg, text)` uses `reg.top`.

### Write a new element

```ts
import { IdenticalInline, block, Nesting, Registry, Paragraphs } from 'glue'

const Bold = IdenticalInline('bold', '*', 'strong')

const Note = block(Nesting.POST)(function note(text: string) {
  return [['aside.note', {}], text]
})

const reg = new Registry([Paragraphs, Bold, Note], { top: Paragraphs })
```

Helpers: `IdenticalInline`, `MirrorInline`, `SingleGroupInline`, `link`, `inline`, `block`, `terminal_block`.
`Nesting.NONE` is for verbatim bodies (code, math). `POST` parses inlines after the block runs. `SUB` pre-parses nested blocks/inlines (used by `Paragraphs`).

## Motivation

There are excellent full CFG parsers, and there are great plaintext parsers
if you're willing to pick a dialect and stick to it, but there's no real way to
extend the parsers yourself or add more block types etc. What has happened as
a result is that we have tons of minutely different dialects and sects of major
text-document writing styles (see: myriad Markdown versions, reStructuredText,
pandoc, etc). In order to add extra types of plain-text formats that don't have
anything to do with the original parser (eg: KaTeX or Mermaid), you either have
to extend the original parser somehow (and deal with custom ASTs or formats)
or make peace with raw html and loading a script into the page that will search
the page and parse based on classes etc (eg, katex).

Take, for example, CriticMarkup. Someone wrote a spec for this, but it's been
implemented in some Markdown parsers and not others, so maybe it's there and
it's great! Or maybe you want it, but you can't have it (sad face). Do you
switch dialects? Does it have all the other features? Maybe write a Pandoc
filter?

It's pretty simple to add CriticMarkup to a registry using **Glue**:

```ts
CriticAdd = MirrorInline('critic-add', '{++', 'ins')
CriticDel = MirrorInline('critic-del', '{--', 'del')
CriticComment = MirrorInline('critic-comment', '{>>', 'span.critic.comment')
CriticHighlight = MirrorInline('critic-highlight', '{==', 'mark')

CriticMarkdown = Registry(CriticAdd, CriticDel, CriticComment, CriticHighlight)
```

I'll leave CriticSub as an exercise for the reader. It fits in a similar vein
as the Link component. It's been implemented in the `library.civet` file if 
you want an answer as to how it looks.

Note: `MirrorInline` is a helper function I provide, which is written
to simply writing a parser for an element with one group in which the start
and end pattern are mirrors of each other - I've defined the start pattern, and
the function will compute the other side eg `++}` and then make the appropriate
regex. There are many such functions available as part of the parser, and
they *significantly* improve the life of the developer. Please take a 
look at them. More explanation/documentation will come soon.

## Examples/Common Architectures

TODO