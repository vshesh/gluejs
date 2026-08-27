#!/usr/bin/env python3
"""Capture Python glue HTML for the JS parity fixtures.

Uses ../glue sources as-is. Stdlib shims stand in for third-party imports
(toolz, regex, …) so this can run without pip.
"""
from __future__ import annotations

import functools
import itertools
import json
import operator
import re
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GLUE = ROOT.parent / 'glue'
OUT = ROOT / 'src' / '__tests__' / 'baselines' / 'python-subset.json'

SAMPLES = [
    ('bold', '*hello*'),
    ('italic', '_world_'),
    ('mono', '`code`'),
    ('strike', '~gone~'),
    ('sup', 'E=mc^{2}'),
    ('sub', 'H_{2}O'),
    ('mixed', 'A *bold* and _italic_ and `mono` line.'),
    ('header', '# Title\n\nbody'),
]


def _install_shims():
    # regex (supports \\K; stdlib re does not — rewrite like the JS port)
    class _Regex(types.ModuleType):
        V1 = 0
        def __init__(self):
            super().__init__('regex')
        def __getattr__(self, k):
            return getattr(re, k)
        def compile(self, p, flags=0):
            if isinstance(p, str):
                # stdlib re has no \\K and no variable-width lookbehind.
                # Our fixtures have no escaped delimiters, so dropping \\K is equivalent.
                p = p.replace(r'\K', '')
                p = p.replace(r'[\w-\.]', r'[\w.-]')
            return re.compile(p, flags)

    sys.modules['regex'] = _Regex()

    inf = types.ModuleType('inflection')
    def underscore(s):
        s = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', s)
        return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s).lower()
    inf.underscore = underscore
    inf.dasherize = lambda s: underscore(s).replace('_', '-')
    inf.camelize = lambda s, uppercase_first_letter=True: s
    sys.modules['inflection'] = inf

    sass = types.ModuleType('sass')
    sass.compile = lambda **kw: ''
    sys.modules['sass'] = sass
    sys.modules['simplejson'] = json
    ruamel = types.ModuleType('ruamel')
    yaml = types.ModuleType('ruamel.yaml')
    yaml.safe_load = lambda *a, **k: {}
    ruamel.yaml = yaml
    sys.modules['ruamel'] = ruamel
    sys.modules['ruamel.yaml'] = yaml

    def cons(el, seq=None):
        if seq is None:
            return lambda s: cons(el, s)
        return [el, *list(seq)]

    def mapcat(f, seq=None):
        if seq is None:
            return lambda s: mapcat(f, s)
        return [y for x in seq for y in f(x)]

    def c_map(f, seq=None):
        if seq is None:
            return lambda s: list(map(f, s))
        return map(f, seq)

    def c_filter(f, seq=None):
        if seq is None:
            return lambda s: list(filter(f, s))
        return filter(f, seq)

    def pipe(x, *fns):
        for f in fns:
            x = f(x)
        return x

    def peek(seq):
        seq = list(seq)
        return seq[0], seq[1:]

    def get(i, seq, default=None):
        try:
            return seq[i]
        except (IndexError, KeyError, TypeError):
            return default

    def partition(n, seq):
        it = iter(seq)
        return zip(*([it] * n))

    def compose(*fns):
        def composed(x):
            for f in reversed(fns):
                x = f(x)
            return x
        return composed

    def valfilter(pred, d):
        return {k: v for k, v in d.items() if pred(v)}

    def valmap(f, d):
        return {k: f(v) for k, v in d.items()}

    t = types.ModuleType('toolz')
    t.map = map
    t.filter = filter
    t.reduce = functools.reduce
    t.identity = lambda x: x
    t.partial = functools.partial
    t.cons = cons
    t.pipe = pipe
    t.accumulate = lambda fn, seq: itertools.accumulate(seq, fn)
    t.concatv = lambda *xs: itertools.chain.from_iterable(xs)
    t.first = lambda x: next(iter(x))
    t.drop = lambda n, seq: itertools.islice(seq, n, None)
    t.peek = peek
    t.get = get
    t.partition = partition
    t.compose = compose
    t.valfilter = valfilter
    t.valmap = valmap
    t.curried = types.ModuleType('toolz.curried')
    t.curried.map = c_map
    t.curried.filter = c_filter
    t.curried.cons = cons
    t.curried.mapcat = mapcat
    sys.modules['toolz'] = t
    sys.modules['toolz.curried'] = t.curried


def main():
    _install_shims()
    sys.path.insert(0, str(GLUE))
    from glue.library import (
        Paragraphs, Bold, Italic, Monospace, Strikethrough,
        Superscript, Subscript, Header,
    )
    from glue.registry import Registry
    from glue.parser import parse
    from glue.html import render

    reg = Registry(Paragraphs, Bold, Italic, Monospace, Strikethrough,
                   Superscript, Subscript, Header, top=Paragraphs)
    cases = []
    for name, src in SAMPLES:
        cases.append({'name': name, 'src': src, 'html': render(parse(reg, src))})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(cases, indent=2) + '\n')
    print(f'wrote {OUT} ({len(cases)} cases)')


if __name__ == '__main__':
    main()
