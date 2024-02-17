import * as R from 'ramda';


// akin to python str.translate
export function translate(from: string, to: string) {
    const translate = (c: string) => { 
      const i = from.indexOf(c)
      return i >= 0 ? to[i] : i 
    }
    return (s:string) => s.split('').map(translate).join('')
}

export function num_groups(regex:RegExp): number {
  return ((new RegExp(regex.toString() + '|')).exec('') || []).length - 1;
}

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
export function escape(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export const makename = (name: string) => { 
  return name.replace(/([a-z])([A-Z])/g, (_, l, u) => `${l}-${u.toString().toLowerCase()}`).toLowerCase()
} 


export function isString(a: any): a is string { 
  return typeof a === 'string';
}

export function isRegex(r: any): r is RegExp {
  return R.type(r) === 'RegExp'
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
        
        var value: string = R.path<any>(v)([args]).toString() ?? ''

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

