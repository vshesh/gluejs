import * as R from 'ramda';


// akin to python str.translate
export function translate(from: string, to: string) {
    const translate = (c: string) => { 
      const i = from.indexOf(c)
      return i >= 0 ? to[i] : c
    }
    return (s:string) => s.split('').map(translate).join('')
}

export function num_groups(regex:RegExp): number {
  return ((new RegExp(regex.source + '|')).exec('') || []).length - 1
}

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function escape(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export const makename = (name: string) => { 
  return name.replace(/([a-z])([A-Z])/g, (_, l, u) => `${l}-${u.toString().toLowerCase()}`).toLowerCase()
} 


/** Mini getopt: `-o`, `--flag`, `--k=v`, and positionals in `._`. */
export type ArgMap = { [k: string]: string | number | boolean | string[] }

/** Mini getopt: `-o`, `--flag`, `--k=v`, and positionals in `._`. */
export function parseArgs(argv: string[], defaults: ArgMap = {}): ArgMap {
  const out: ArgMap = { ...defaults, _: [] as string[] }
  for (const a of argv) {
    if (a.startsWith('--') && a.includes('=')) {
      const i = a.indexOf('=')
      out[a.slice(2, i)] = a.slice(i + 1)
    } else if (a.startsWith('--')) {
      out[a.slice(2)] = true
    } else if (a.startsWith('-') && a.length > 1) {
      for (const c of a.slice(1)) out[c] = true
    } else {
      (out._ as string[]).push(a)
    }
  }
  return out
}

export function isRegex(r: any): r is RegExp {
  return R.type(r) === 'RegExp'
}

/** zip rows to columns, padding short rows with `fill`. */
export function zipLongest<T>(rows: T[][], fill: T): T[][] {
  const width = Math.max(0, ...rows.map(r => r.length))
  return Array.from({ length: width }, (_, i) => rows.map(r => r[i] ?? fill))
}

/** header id slug — matches python glue.library.Header */
export function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9 ]/g, '').trim().replace(/ /g, '-').toLowerCase()
}

/** Split on an unescaped separator, with optional spaces around it. */
export function splitUnescaped(text: string, sep: string): string[] {
  return text.split(new RegExp(String.raw` ?(?<!\\)(?:\\\\)*${escape(sep)} ?`))
}

// ------------------------- format strings like python implementation -------------------

//  ValueError :: String -> Error
function ValueError(message: string) {
  var err = new Error(message);
  err.name = 'ValueError';
  return err;
}

// ignore this function its only use is for the `format` function below
// taken from some js library that I can't remember. 
//  create :: Object -> String,*... -> String
function create(transformers: {[name: string]: (s: string) => string}) {
  return function(template: string, ...args: any[]) {
    var idx = 0;
    var state = 'UNDEFINED';

    return template.replace(
      /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g,
      function(_match, literal: string, _key: string, xf: string): string {
        if (literal != null) {
          return literal;
        }
        var key = _key;
        if (key.length > 0) { 
          if (state === 'IMPLICIT') throw ValueError('cannot switch from implicit to explicit numbering');
          state = 'EXPLICIT';
        }
        else { 
          if (state === 'EXPLICIT') throw ValueError('cannot switch from explicit to implicit numbering');
          state = 'IMPLICIT';
          key = String(idx);
          idx += 1;
        }

        //  1.  Split the key into a lookup path.
        //  2.  If the first path component is not an index, prepend '0'.
        //  3.  Reduce the lookup path to a single result. If the lookup
        //      succeeds the result is a singleton array containing the
        //      value at the lookup path; otherwise the result is [].
        //  4.  Unwrap the result by reducing with '' as the default value.
        var path = key.split('.');
        let v = (/^\d+$/.test(path[0]) ? path : ['0'].concat(path))
        
        var value: string = (R.path<any>(v)(args) ?? '').toString()

        if (xf == null) return value;
        else if (Object.prototype.hasOwnProperty.call(transformers, xf)) {
          return transformers[xf](value);
        }
        else throw ValueError('no transformer named "' + xf + '"');
      }
    );
  };
}

//  format :: String,*... -> String
export const format = Object.assign(create({}), {create: create});

/** YAML subset used by YamlComponent / GuitarChord: maps, nested maps, scalar lists. */
export function parseYaml(text: string): unknown {
  const src = text.replace(/\t/g, '  ')
  const trimmed = src.trim()
  if (!trimmed) return {}
  if (trimmed[0] === '{' || trimmed[0] === '[') return JSON.parse(trimmed)

  type Line = { indent: number, raw: string }
  const lines: Line[] = src.split('\n').flatMap(line => {
    const t = line.trimEnd()
    if (!t.trim() || t.trimStart().startsWith('#')) return []
    return [{ indent: t.length - t.trimStart().length, raw: t.trimStart() }]
  })

  const scalar = (s: string): unknown => {
    if (s === 'true') return true
    if (s === 'false') return false
    if (s === 'null' || s === '~') return null
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
    return s
  }

  const parseAt = (i: number, indent: number): [unknown, number] => {
    if (i >= lines.length || lines[i].indent < indent) return [null, i]
    if (lines[i].raw.startsWith('- ')) {
      const arr: unknown[] = []
      while (i < lines.length && lines[i].indent === indent && lines[i].raw.startsWith('- ')) {
        const rest = lines[i].raw.slice(2).trim()
        i++
        if (rest === '') {
          const [child, n] = i < lines.length && lines[i].indent > indent
            ? parseAt(i, lines[i].indent) : [null, i]
          arr.push(child)
          i = n
        } else if (rest.endsWith(':') && !rest.slice(0, -1).includes(':')) {
          const key = rest.slice(0, -1).trim()
          const [child, n] = i < lines.length && lines[i].indent > indent
            ? parseAt(i, lines[i].indent) : [null, i]
          arr.push({ [key]: child })
          i = n
        } else if (rest.includes(': ')) {
          const c = rest.indexOf(': ')
          arr.push({ [rest.slice(0, c)]: scalar(rest.slice(c + 2)) })
        } else {
          arr.push(scalar(rest))
        }
      }
      return [arr, i]
    }
    const obj: Record<string, unknown> = {}
    while (i < lines.length && lines[i].indent === indent && !lines[i].raw.startsWith('- ')) {
      const line = lines[i].raw
      const c = line.indexOf(':')
      if (c < 0) { i++; continue }
      const key = line.slice(0, c).trim()
      const rest = line.slice(c + 1).trim()
      i++
      if (rest === '') {
        if (i < lines.length && lines[i].indent > indent) {
          const [child, n] = parseAt(i, lines[i].indent)
          obj[key] = child
          i = n
        } else obj[key] = null
      } else {
        obj[key] = scalar(rest)
      }
    }
    return [obj, i]
  }

  const [val] = parseAt(0, lines[0]?.indent ?? 0)
  return val
}

