"use strict";
var Glue = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all3) => {
    for (var name in all3)
      __defProp(target, name, { get: all3[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/browser.ts
  var browser_exports = {};
  __export(browser_exports, {
    Aside: () => Aside,
    AssetType: () => AssetType,
    Audio: () => Audio,
    Blockquote: () => Blockquote,
    Bold: () => Bold,
    Classed: () => Classed,
    Code: () => Code,
    CriticAdd: () => CriticAdd,
    CriticComment: () => CriticComment,
    CriticDel: () => CriticDel,
    CriticHighlight: () => CriticHighlight,
    CriticMarkup: () => CriticMarkup,
    CriticSub: () => CriticSub,
    Figure: () => Figure,
    FullImage: () => FullImage,
    Header: () => Header,
    HorizontalRule: () => HorizontalRule,
    InlineImage: () => InlineImage,
    Italic: () => Italic,
    Katex: () => Katex,
    Link: () => Link,
    List: () => List,
    Markdown: () => Markdown,
    MarkdownInline: () => MarkdownInline,
    Matrix: () => Matrix,
    Mermaid: () => Mermaid,
    Monospace: () => Monospace,
    NoopBlock: () => NoopBlock,
    OrderedList: () => OrderedList,
    Paragraphs: () => Paragraphs,
    Registry: () => Registry,
    SideBySide: () => SideBySide,
    Standard: () => Standard,
    StandardExtended: () => StandardExtended,
    StandardInline: () => StandardInline,
    Strikethrough: () => Strikethrough,
    Subscript: () => Subscript,
    Superscript: () => Superscript,
    TagBasic: () => TagBasic,
    Tooltip: () => Tooltip,
    Underline: () => Underline,
    UnorderedList: () => UnorderedList,
    Video: () => Video,
    Youtube: () => Youtube,
    assetInline: () => assetInline,
    assetUrl: () => assetUrl,
    enhance: () => enhance,
    injectAssets: () => injectAssets,
    parse: () => parse,
    render: () => render,
    renderAll: () => renderAll,
    renderElement: () => renderElement,
    toHTML: () => toHTML,
    withAssets: () => withAssets
  });

  // node_modules/ramda/es/internal/_isPlaceholder.js
  function _isPlaceholder(a) {
    return a != null && typeof a === "object" && a["@@functional/placeholder"] === true;
  }

  // node_modules/ramda/es/internal/_curry1.js
  function _curry1(fn) {
    return function f1(a) {
      if (arguments.length === 0 || _isPlaceholder(a)) {
        return f1;
      } else {
        return fn.apply(this, arguments);
      }
    };
  }

  // node_modules/ramda/es/internal/_curry2.js
  function _curry2(fn) {
    return function f2(a, b) {
      switch (arguments.length) {
        case 0:
          return f2;
        case 1:
          return _isPlaceholder(a) ? f2 : _curry1(function(_b) {
            return fn(a, _b);
          });
        default:
          return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function(_a) {
            return fn(_a, b);
          }) : _isPlaceholder(b) ? _curry1(function(_b) {
            return fn(a, _b);
          }) : fn(a, b);
      }
    };
  }

  // node_modules/ramda/es/internal/_arity.js
  function _arity(n, fn) {
    switch (n) {
      case 0:
        return function() {
          return fn.apply(this, arguments);
        };
      case 1:
        return function(a0) {
          return fn.apply(this, arguments);
        };
      case 2:
        return function(a0, a1) {
          return fn.apply(this, arguments);
        };
      case 3:
        return function(a0, a1, a2) {
          return fn.apply(this, arguments);
        };
      case 4:
        return function(a0, a1, a2, a3) {
          return fn.apply(this, arguments);
        };
      case 5:
        return function(a0, a1, a2, a3, a4) {
          return fn.apply(this, arguments);
        };
      case 6:
        return function(a0, a1, a2, a3, a4, a5) {
          return fn.apply(this, arguments);
        };
      case 7:
        return function(a0, a1, a2, a3, a4, a5, a6) {
          return fn.apply(this, arguments);
        };
      case 8:
        return function(a0, a1, a2, a3, a4, a5, a6, a7) {
          return fn.apply(this, arguments);
        };
      case 9:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {
          return fn.apply(this, arguments);
        };
      case 10:
        return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
          return fn.apply(this, arguments);
        };
      default:
        throw new Error("First argument to _arity must be a non-negative integer no greater than ten");
    }
  }

  // node_modules/ramda/es/internal/_curryN.js
  function _curryN(length, received, fn) {
    return function() {
      var combined = [];
      var argsIdx = 0;
      var left = length;
      var combinedIdx = 0;
      var hasPlaceholder = false;
      while (combinedIdx < received.length || argsIdx < arguments.length) {
        var result;
        if (combinedIdx < received.length && (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)) {
          result = received[combinedIdx];
        } else {
          result = arguments[argsIdx];
          argsIdx += 1;
        }
        combined[combinedIdx] = result;
        if (!_isPlaceholder(result)) {
          left -= 1;
        } else {
          hasPlaceholder = true;
        }
        combinedIdx += 1;
      }
      return !hasPlaceholder && left <= 0 ? fn.apply(this, combined) : _arity(Math.max(0, left), _curryN(length, combined, fn));
    };
  }

  // node_modules/ramda/es/curryN.js
  var curryN = /* @__PURE__ */ _curry2(function curryN2(length, fn) {
    if (length === 1) {
      return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
  });
  var curryN_default = curryN;

  // node_modules/ramda/es/internal/_isArray.js
  var isArray_default = Array.isArray || function _isArray(val) {
    return val != null && val.length >= 0 && Object.prototype.toString.call(val) === "[object Array]";
  };

  // node_modules/ramda/es/internal/_isTransformer.js
  function _isTransformer(obj) {
    return obj != null && typeof obj["@@transducer/step"] === "function";
  }

  // node_modules/ramda/es/internal/_dispatchable.js
  function _dispatchable(methodNames, transducerCreator, fn) {
    return function() {
      if (arguments.length === 0) {
        return fn();
      }
      var obj = arguments[arguments.length - 1];
      if (!isArray_default(obj)) {
        var idx = 0;
        while (idx < methodNames.length) {
          if (typeof obj[methodNames[idx]] === "function") {
            return obj[methodNames[idx]].apply(obj, Array.prototype.slice.call(arguments, 0, -1));
          }
          idx += 1;
        }
        if (_isTransformer(obj)) {
          var transducer = transducerCreator.apply(null, Array.prototype.slice.call(arguments, 0, -1));
          return transducer(obj);
        }
      }
      return fn.apply(this, arguments);
    };
  }

  // node_modules/ramda/es/internal/_reduced.js
  function _reduced(x) {
    return x && x["@@transducer/reduced"] ? x : {
      "@@transducer/value": x,
      "@@transducer/reduced": true
    };
  }

  // node_modules/ramda/es/internal/_xfBase.js
  var xfBase_default = {
    init: function() {
      return this.xf["@@transducer/init"]();
    },
    result: function(result) {
      return this.xf["@@transducer/result"](result);
    }
  };

  // node_modules/ramda/es/internal/_xall.js
  var XAll = /* @__PURE__ */ (function() {
    function XAll2(f, xf) {
      this.xf = xf;
      this.f = f;
      this.all = true;
    }
    XAll2.prototype["@@transducer/init"] = xfBase_default.init;
    XAll2.prototype["@@transducer/result"] = function(result) {
      if (this.all) {
        result = this.xf["@@transducer/step"](result, true);
      }
      return this.xf["@@transducer/result"](result);
    };
    XAll2.prototype["@@transducer/step"] = function(result, input) {
      if (!this.f(input)) {
        this.all = false;
        result = _reduced(this.xf["@@transducer/step"](result, false));
      }
      return result;
    };
    return XAll2;
  })();
  function _xall(f) {
    return function(xf) {
      return new XAll(f, xf);
    };
  }

  // node_modules/ramda/es/all.js
  var all = /* @__PURE__ */ _curry2(
    /* @__PURE__ */ _dispatchable(["all"], _xall, function all2(fn, list2) {
      var idx = 0;
      while (idx < list2.length) {
        if (!fn(list2[idx])) {
          return false;
        }
        idx += 1;
      }
      return true;
    })
  );
  var all_default = all;

  // node_modules/ramda/es/internal/_has.js
  function _has(prop, obj) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  // node_modules/ramda/es/internal/_isArguments.js
  var toString = Object.prototype.toString;
  var _isArguments = /* @__PURE__ */ (function() {
    return toString.call(arguments) === "[object Arguments]" ? function _isArguments2(x) {
      return toString.call(x) === "[object Arguments]";
    } : function _isArguments2(x) {
      return _has("callee", x);
    };
  })();
  var isArguments_default = _isArguments;

  // node_modules/ramda/es/keys.js
  var hasEnumBug = !/* @__PURE__ */ {
    toString: null
  }.propertyIsEnumerable("toString");
  var nonEnumerableProps = ["constructor", "valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];
  var hasArgsEnumBug = /* @__PURE__ */ (function() {
    "use strict";
    return arguments.propertyIsEnumerable("length");
  })();
  var contains = function contains2(list2, item) {
    var idx = 0;
    while (idx < list2.length) {
      if (list2[idx] === item) {
        return true;
      }
      idx += 1;
    }
    return false;
  };
  var keys = typeof Object.keys === "function" && !hasArgsEnumBug ? /* @__PURE__ */ _curry1(function keys2(obj) {
    return Object(obj) !== obj ? [] : Object.keys(obj);
  }) : /* @__PURE__ */ _curry1(function keys3(obj) {
    if (Object(obj) !== obj) {
      return [];
    }
    var prop, nIdx;
    var ks = [];
    var checkArgsLength = hasArgsEnumBug && isArguments_default(obj);
    for (prop in obj) {
      if (_has(prop, obj) && (!checkArgsLength || prop !== "length")) {
        ks[ks.length] = prop;
      }
    }
    if (hasEnumBug) {
      nIdx = nonEnumerableProps.length - 1;
      while (nIdx >= 0) {
        prop = nonEnumerableProps[nIdx];
        if (_has(prop, obj) && !contains(ks, prop)) {
          ks[ks.length] = prop;
        }
        nIdx -= 1;
      }
    }
    return ks;
  });
  var keys_default = keys;

  // node_modules/ramda/es/type.js
  var type = /* @__PURE__ */ _curry1(function type2(val) {
    return val === null ? "Null" : val === void 0 ? "Undefined" : Object.prototype.toString.call(val).slice(8, -1);
  });
  var type_default = type;

  // node_modules/ramda/es/internal/_map.js
  function _map(fn, functor) {
    var idx = 0;
    var len = functor.length;
    var result = Array(len);
    while (idx < len) {
      result[idx] = fn(functor[idx]);
      idx += 1;
    }
    return result;
  }

  // node_modules/ramda/es/internal/_arrayReduce.js
  function _arrayReduce(reducer, acc, list2) {
    var index = 0;
    var length = list2.length;
    while (index < length) {
      acc = reducer(acc, list2[index]);
      index += 1;
    }
    return acc;
  }

  // node_modules/ramda/es/internal/_xmap.js
  var XMap = /* @__PURE__ */ (function() {
    function XMap2(f, xf) {
      this.xf = xf;
      this.f = f;
    }
    XMap2.prototype["@@transducer/init"] = xfBase_default.init;
    XMap2.prototype["@@transducer/result"] = xfBase_default.result;
    XMap2.prototype["@@transducer/step"] = function(result, input) {
      return this.xf["@@transducer/step"](result, this.f(input));
    };
    return XMap2;
  })();
  var _xmap = function _xmap2(f) {
    return function(xf) {
      return new XMap(f, xf);
    };
  };
  var xmap_default = _xmap;

  // node_modules/ramda/es/map.js
  var map = /* @__PURE__ */ _curry2(
    /* @__PURE__ */ _dispatchable(["fantasy-land/map", "map"], xmap_default, function map2(fn, functor) {
      switch (Object.prototype.toString.call(functor)) {
        case "[object Function]":
          return curryN_default(functor.length, function() {
            return fn.call(this, functor.apply(this, arguments));
          });
        case "[object Object]":
          return _arrayReduce(function(acc, key) {
            acc[key] = fn(functor[key]);
            return acc;
          }, {}, keys_default(functor));
        default:
          return _map(fn, functor);
      }
    })
  );
  var map_default = map;

  // node_modules/ramda/es/internal/_isInteger.js
  var isInteger_default = Number.isInteger || function _isInteger(n) {
    return n << 0 === n;
  };

  // node_modules/ramda/es/internal/_isString.js
  function _isString(x) {
    return Object.prototype.toString.call(x) === "[object String]";
  }

  // node_modules/ramda/es/nth.js
  var nth = /* @__PURE__ */ _curry2(function nth2(offset, list2) {
    var idx = offset < 0 ? list2.length + offset : offset;
    return _isString(list2) ? list2.charAt(idx) : list2[idx];
  });
  var nth_default = nth;

  // node_modules/ramda/es/internal/_isArrayLike.js
  var _isArrayLike = /* @__PURE__ */ _curry1(function isArrayLike(x) {
    if (isArray_default(x)) {
      return true;
    }
    if (!x) {
      return false;
    }
    if (typeof x !== "object") {
      return false;
    }
    if (_isString(x)) {
      return false;
    }
    if (x.length === 0) {
      return true;
    }
    if (x.length > 0) {
      return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
    }
    return false;
  });
  var isArrayLike_default = _isArrayLike;

  // node_modules/ramda/es/internal/_createReduce.js
  var symIterator = typeof Symbol !== "undefined" ? Symbol.iterator : "@@iterator";
  function _createReduce(arrayReduce, methodReduce, iterableReduce) {
    return function _reduce(xf, acc, list2) {
      if (isArrayLike_default(list2)) {
        return arrayReduce(xf, acc, list2);
      }
      if (list2 == null) {
        return acc;
      }
      if (typeof list2["fantasy-land/reduce"] === "function") {
        return methodReduce(xf, acc, list2, "fantasy-land/reduce");
      }
      if (list2[symIterator] != null) {
        return iterableReduce(xf, acc, list2[symIterator]());
      }
      if (typeof list2.next === "function") {
        return iterableReduce(xf, acc, list2);
      }
      if (typeof list2.reduce === "function") {
        return methodReduce(xf, acc, list2, "reduce");
      }
      throw new TypeError("reduce: list must be array or iterable");
    };
  }

  // node_modules/ramda/es/internal/_xArrayReduce.js
  function _xArrayReduce(xf, acc, list2) {
    var idx = 0;
    var len = list2.length;
    while (idx < len) {
      acc = xf["@@transducer/step"](acc, list2[idx]);
      if (acc && acc["@@transducer/reduced"]) {
        acc = acc["@@transducer/value"];
        break;
      }
      idx += 1;
    }
    return xf["@@transducer/result"](acc);
  }

  // node_modules/ramda/es/bind.js
  var bind = /* @__PURE__ */ _curry2(function bind2(fn, thisObj) {
    return _arity(fn.length, function() {
      return fn.apply(thisObj, arguments);
    });
  });
  var bind_default = bind;

  // node_modules/ramda/es/internal/_xReduce.js
  function _xIterableReduce(xf, acc, iter) {
    var step = iter.next();
    while (!step.done) {
      acc = xf["@@transducer/step"](acc, step.value);
      if (acc && acc["@@transducer/reduced"]) {
        acc = acc["@@transducer/value"];
        break;
      }
      step = iter.next();
    }
    return xf["@@transducer/result"](acc);
  }
  function _xMethodReduce(xf, acc, obj, methodName) {
    return xf["@@transducer/result"](obj[methodName](bind_default(xf["@@transducer/step"], xf), acc));
  }
  var _xReduce = /* @__PURE__ */ _createReduce(_xArrayReduce, _xMethodReduce, _xIterableReduce);
  var xReduce_default = _xReduce;

  // node_modules/ramda/es/internal/_makeFlat.js
  function _makeFlat(recursive) {
    return function flatt(list2) {
      var value2, jlen, j;
      var result = [];
      var idx = 0;
      var ilen = list2.length;
      while (idx < ilen) {
        if (isArrayLike_default(list2[idx])) {
          value2 = recursive ? flatt(list2[idx]) : list2[idx];
          j = 0;
          jlen = value2.length;
          while (j < jlen) {
            result[result.length] = value2[j];
            j += 1;
          }
        } else {
          result[result.length] = list2[idx];
        }
        idx += 1;
      }
      return result;
    };
  }

  // node_modules/ramda/es/internal/_forceReduced.js
  function _forceReduced(x) {
    return {
      "@@transducer/value": x,
      "@@transducer/reduced": true
    };
  }

  // node_modules/ramda/es/internal/_flatCat.js
  var tInit = "@@transducer/init";
  var tStep = "@@transducer/step";
  var tResult = "@@transducer/result";
  var XPreservingReduced = /* @__PURE__ */ (function() {
    function XPreservingReduced2(xf) {
      this.xf = xf;
    }
    XPreservingReduced2.prototype[tInit] = xfBase_default.init;
    XPreservingReduced2.prototype[tResult] = xfBase_default.result;
    XPreservingReduced2.prototype[tStep] = function(result, input) {
      var ret = this.xf[tStep](result, input);
      return ret["@@transducer/reduced"] ? _forceReduced(ret) : ret;
    };
    return XPreservingReduced2;
  })();
  var XFlatCat = /* @__PURE__ */ (function() {
    function XFlatCat2(xf) {
      this.xf = new XPreservingReduced(xf);
    }
    XFlatCat2.prototype[tInit] = xfBase_default.init;
    XFlatCat2.prototype[tResult] = xfBase_default.result;
    XFlatCat2.prototype[tStep] = function(result, input) {
      return !isArrayLike_default(input) ? _xArrayReduce(this.xf, result, [input]) : xReduce_default(this.xf, result, input);
    };
    return XFlatCat2;
  })();
  var _flatCat = function _xcat(xf) {
    return new XFlatCat(xf);
  };
  var flatCat_default = _flatCat;

  // node_modules/ramda/es/internal/_xchain.js
  function _xchain(f) {
    return function(xf) {
      return xmap_default(f)(flatCat_default(xf));
    };
  }

  // node_modules/ramda/es/chain.js
  var chain = /* @__PURE__ */ _curry2(
    /* @__PURE__ */ _dispatchable(["fantasy-land/chain", "chain"], _xchain, function chain2(fn, monad) {
      if (typeof monad === "function") {
        return function(x) {
          return fn(monad(x))(x);
        };
      }
      return _makeFlat(false)(map_default(fn, monad));
    })
  );
  var chain_default = chain;

  // node_modules/ramda/es/reverse.js
  var reverse = /* @__PURE__ */ _curry1(function reverse2(list2) {
    return _isString(list2) ? list2.split("").reverse().join("") : Array.prototype.slice.call(list2, 0).reverse();
  });
  var reverse_default = reverse;

  // node_modules/ramda/es/internal/_identity.js
  function _identity(x) {
    return x;
  }

  // node_modules/ramda/es/identity.js
  var identity = /* @__PURE__ */ _curry1(_identity);
  var identity_default = identity;

  // node_modules/ramda/es/paths.js
  var paths = /* @__PURE__ */ _curry2(function paths2(pathsArray, obj) {
    return pathsArray.map(function(paths3) {
      var val = obj;
      var idx = 0;
      var p;
      while (idx < paths3.length) {
        if (val == null) {
          return;
        }
        p = paths3[idx];
        val = isInteger_default(p) ? nth_default(p, val) : val[p];
        idx += 1;
      }
      return val;
    });
  });
  var paths_default = paths;

  // node_modules/ramda/es/path.js
  var path = /* @__PURE__ */ _curry2(function path2(pathAr, obj) {
    return paths_default([pathAr], obj)[0];
  });
  var path_default = path;

  // src/util.ts
  function translate(from, to) {
    const translate2 = (c) => {
      const i = from.indexOf(c);
      return i >= 0 ? to[i] : c;
    };
    return (s) => s.split("").map(translate2).join("");
  }
  function num_groups(regex) {
    return (new RegExp(regex.source + "|").exec("") || []).length - 1;
  }
  function escape(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  var makename = (name) => {
    return name.replace(/([a-z])([A-Z])/g, (_, l, u) => `${l}-${u.toString().toLowerCase()}`).toLowerCase();
  };
  function parseArgs(argv, defaults = {}) {
    const out = { ...defaults, _: [] };
    for (const a of argv) {
      if (a.startsWith("--") && a.includes("=")) {
        const i = a.indexOf("=");
        out[a.slice(2, i)] = a.slice(i + 1);
      } else if (a.startsWith("--")) {
        out[a.slice(2)] = true;
      } else if (a.startsWith("-") && a.length > 1) {
        for (const c of a.slice(1)) out[c] = true;
      } else {
        out._.push(a);
      }
    }
    return out;
  }
  function zipLongest(rows, fill) {
    const width = Math.max(0, ...rows.map((r2) => r2.length));
    return Array.from({ length: width }, (_, i) => rows.map((r2) => r2[i] ?? fill));
  }
  function slug(s) {
    return s.replace(/[^A-Za-z0-9 ]/g, "").trim().replace(/ /g, "-").toLowerCase();
  }
  function splitUnescaped(text, sep) {
    return text.split(new RegExp(String.raw` ?(?<!\\)(?:\\\\)*${escape(sep)} ?`));
  }
  function ValueError(message) {
    var err = new Error(message);
    err.name = "ValueError";
    return err;
  }
  function create(transformers) {
    return function(template, ...args) {
      var idx = 0;
      var state = "UNDEFINED";
      return template.replace(
        /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g,
        function(_match, literal, _key, xf) {
          if (literal != null) {
            return literal;
          }
          var key = _key;
          if (key.length > 0) {
            if (state === "IMPLICIT") throw ValueError("cannot switch from implicit to explicit numbering");
            state = "EXPLICIT";
          } else {
            if (state === "EXPLICIT") throw ValueError("cannot switch from explicit to implicit numbering");
            state = "IMPLICIT";
            key = String(idx);
            idx += 1;
          }
          var path3 = key.split(".");
          let v = /^\d+$/.test(path3[0]) ? path3 : ["0"].concat(path3);
          var value2 = (path_default(v)(args) ?? "").toString();
          if (xf == null) return value2;
          else if (Object.prototype.hasOwnProperty.call(transformers, xf)) {
            return transformers[xf](value2);
          } else throw ValueError('no transformer named "' + xf + '"');
        }
      );
    };
  }
  var format = Object.assign(create({}), { create });

  // src/nestable.ts
  function realQ(x) {
    return x !== null && x !== void 0;
  }
  function isLeaf(n) {
    return !(n instanceof Array);
  }
  function value(n) {
    return n[0];
  }
  function construct(b, branches) {
    return [b, ...branches];
  }
  function branch(n) {
    if (isLeaf(n)) return [];
    const [_, ...rest] = n;
    return rest;
  }
  function forestify1(start, end, tokens, pos = 0) {
    let forest = [];
    let i = pos;
    let level = 0;
    for (const token of tokens) {
      const s = start(token);
      if (s !== void 0) {
        if (level == 0) {
          forest.push([s]);
          level += 1;
        } else {
          ;
          forest[forest.length - 1].push(token);
          level += 1;
        }
      } else if (!!end(token)) {
        if (level > 1) {
          ;
          forest[forest.length - 1].push(token);
          level -= 1;
        } else if (level === 1) {
          level = 0;
        } else {
          throw Error(`The input string does not have balanced start and end tokens, ${tokens}`);
        }
      } else {
        if (level == 0) forest.push(token);
        else forest[forest.length - 1].push(token);
      }
    }
    return forest;
  }
  function transform(l, b, n, tree, deep = true) {
    return construct(b(value(tree)), chain_default(
      (x) => isLeaf(x) ? (deep ? chain_default((y) => isLeaf(y) ? [y] : n(y)) : identity_default)(l(x)) : n(transform(l, b, n, x))
    )(branch(tree)));
  }
  function transformleaves(f, tree, deep = true) {
    return transform(f, identity_default, (y) => [y], tree, deep);
  }
  function coalesce(pred, tree) {
    return transform((x) => [x], identity_default, (y) => pred(y) ? branch(y) : [y], tree, false);
  }

  // src/elements.ts
  var r = String.raw;
  var AssetType = /* @__PURE__ */ ((AssetType2) => {
    AssetType2[AssetType2["JS"] = 0] = "JS";
    AssetType2[AssetType2["CSS"] = 1] = "CSS";
    return AssetType2;
  })(AssetType || {});
  var Element2 = class {
    // IMPORTANT: The function passed to block()/inline() factory functions must use a camelCase
    // or lowercase name that differs from the outer const variable name. Bundlers (esbuild,
    // webpack) rename inner named function expressions to avoid shadowing outer variables, which
    // would corrupt the element name. Convention: outer = PascalCase, inner fn = camelCase.
    // e.g.  const MyBlock = block()(function myBlock(text) { ... })
    constructor(parse2, nest, subElements) {
      this.nest = nest;
      this.subElements = subElements;
      this.name = makename(parse2.name);
      this.assets = [];
    }
    sub(clazz) {
      return this.subElements.filter((x) => x instanceof clazz || x === "all" || x === "inherit");
    }
    /** Shallow copy with overridden fields (python `_replace`). */
    with(props) {
      return Object.assign(Object.create(Object.getPrototypeOf(this)), this, props);
    }
    validate() {
      if (this.nest === 3 /* NONE */ && this.subElements.length !== 0) return false;
      return true;
    }
    addAsset(asset) {
      this.assets.push(asset.trim());
      return this;
    }
  };
  function assetUrl(type3, url) {
    return (elem) => {
      elem.addAsset(type3 === 0 /* JS */ ? `<script src="${url}"></script>` : `<link rel="stylesheet" href="${url}">`);
      return elem;
    };
  }
  function assetInline(type3, contents) {
    return (elem) => {
      elem.addAsset(type3 === 0 /* JS */ ? `<script>
${contents}
</script>` : `<style>
${contents}
</style>`);
      return elem;
    };
  }
  function withAssets(elem, ...mods) {
    return mods.reduce((e, m) => m(e), elem);
  }
  var Block = class extends Element2 {
    constructor(parse2, nest = 1 /* POST */, sub = ["all"], opts = {}) {
      super(parse2, nest, sub);
      this.parse = parse2;
      this.opts = opts;
    }
  };
  var Inline = class extends Element2 {
    constructor(pattern, parse2, nest = 0 /* FRAME */, sub = ["all"], escape2 = "", display = 1 /* INLINE */) {
      super(parse2, nest, sub ?? ["all"]);
      this.parse = parse2;
      this.regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      this.escape = escape2;
      this.display = display;
    }
    validate() {
      const pattern = this.regex.source;
      if (this.display === 0 /* BLOCK */ && !(pattern.startsWith("^") && pattern.endsWith("$"))) return false;
      return super.validate();
    }
  };
  function block(one, two, three, four) {
    if (typeof one === "object") {
      return block(one.parser, one.nest, one.sub, one.opts);
    } else {
      if (one == void 0) {
        return (p) => block(p, two, three, four);
      }
      if (typeof one !== "function") {
        return (p) => block(p, one, two, three);
      }
      return new Block(one, two, three, four);
    }
  }
  function inline(a, b, c, d, e, f) {
    if (type_default(a) === "Object") return inline(a.regex, a.parser, a.nest, a.escape, a.sub, a.display);
    const isPatt = a instanceof RegExp || typeof a === "string";
    if (isPatt && type_default(b) === "Function") return new Inline(a, b, c, e, d, f);
    if (isPatt && b === void 0) return (p) => new Inline(a, p, c, e, d, f);
    if (a === void 0) return (regex, p) => inline(regex, p);
    return (regex, p) => inline(regex, p, a, b, c, d);
  }
  function terminal_block(opts = {}) {
    return (p) => block(p, 3 /* NONE */, [], opts);
  }
  var Patterns = {
    escape: r`(?<!\\)(?:\\\\)*{0}`,
    single_group: r`(?<=(?<!\\)(?:\\\\)*){0}(.*?(?<!\\)(?:\\\\)*){1}`,
    link: r`(?<=(?<!\\)(?:\\\\)*){0}\[((?:(?:[^\[])|(?:\[.*?\]))*?(?<!\\)(?:\\\\)*)\]\(((?:\([^\)]*\)|[^)\n])*)\)`,
    double_group: r`(?<=(?<!\\)(?:\\\\)*)\{0}(.*?(?<!\\)(?:\\\\)*){1}(.*?(?<!\\)(?:\\\\)*){2}`,
    // matches structures like <ident.class.class2:text> useful for one line html tag formats.
    tag_simple: r`(?<=(?<!\\)(?:\\\\)*)<([a-zA-Z][a-zA-Z0-9_-]*)((?:\.[a-zA-Z][a-zA-Z0-9_-]*)*):\s*([^>]+)>`,
    tag_attributes: r`(?<=(?<!\\)(?:\\\\)*)<([a-zA-Z][a-zA-Z0-9_-]*)((?:\.[a-zA-Z][a-zA-Z0-9_-]*)*)(?:\s+([a-zA-Z]+)=("[^"]+"))+:\s*([^>]+)>`
  };
  function inline_one(start, end, nest = 0 /* FRAME */, sub = void 0, display = 1 /* INLINE */) {
    const p = Patterns.single_group.replace("{0}", escape(start)).replace("{1}", escape(end));
    const patt = new RegExp(p);
    return (p2) => inline(patt, p2, nest, start[0] + end[0], sub, display);
  }
  function SingleGroupInline(name, start, end, tag, attr = {}) {
    const obj = {
      [name](body) {
        return [[tag, attr], ...body];
      }
    };
    return inline_one(start, end)(obj[name]);
  }
  function IdenticalInline(name, s, tag, attr = {}) {
    return SingleGroupInline(name, s, s, tag, attr);
  }
  function MirrorInline(name, start, tag, attr = {}) {
    return SingleGroupInline(name, start, translate("()[]{}<>", ")(][}{><")(reverse_default(start)), tag, attr);
  }
  function link(designation, nest = 1 /* POST */, sub = ["inherit"]) {
    const pattern = new RegExp(Patterns.link.replace("{0}", designation));
    return (p) => inline(pattern, p, nest, "()[]" + (designation[0] ?? ""), sub);
  }
  function inline_two(start, mid, end, nest = 1 /* POST */, sub = ["inherit"]) {
    const pattern = new RegExp(format(Patterns.double_group, start, mid, end));
    return inline(pattern, void 0, nest, "", sub);
  }

  // src/parser.ts
  function isTag(x) {
    const o = x?.[0];
    return typeof o === "string" || Array.isArray(o) && o.length === 2 && typeof o[0] === "string" && type_default(o[1]) === "Object";
  }
  var Registry = class _Registry extends Map {
    constructor(elements = [], opts = {}) {
      super();
      /** bumped on mutation so compiled inline regexes stay in sync */
      this.rev = 0;
      this.add(...elements);
      if (opts.top) this.top = opts.top;
    }
    add(...args) {
      this.rev++;
      for (const a of args) {
        if (a instanceof Element2) this.set(a.name, a);
        else this.set(...a);
      }
      return this;
    }
    remove(...args) {
      this.rev++;
      for (const a of args) this.delete(typeof a === "string" ? a : a.name);
      return this;
    }
    clone() {
      const r2 = new _Registry(this.values(), { top: this.top });
      return r2;
    }
    /** Copy-union, like python `|`. */
    merge(other) {
      const r2 = this.clone();
      for (const [k, v] of other) r2.set(k, v);
      if (other.top && !r2.top) r2.top = other.top;
      return r2;
    }
    /** Copy-add, like python `+`. */
    plus(els) {
      return this.clone().add(...els);
    }
    /** Copy-remove, like python `-`. */
    minus(els) {
      return this.clone().remove(...els);
    }
    resolve(e) {
      if (e instanceof Element2) return e;
      const v = this.get(e);
      if (v === void 0) throw Error(`Element ${e} not found in registry`);
      return v;
    }
    inlines() {
      return Array.from(this.values()).filter((x) => x instanceof Inline);
    }
    blocks() {
      return Array.from(this.values()).filter((x) => x instanceof Block);
    }
    assets() {
      return [...new Set(Array.from(this.values()).flatMap((x) => x.assets))].join("\n");
    }
    validate() {
      if (!this.top || !(this.top instanceof Block)) return false;
      for (const e of this.values()) if (!e.validate()) return false;
      return true;
    }
    inline_subscriptions(names, parent) {
      if (names.includes("all")) return this.inlines();
      let l = [];
      if (parent && names.includes("inherit")) {
        if (parent.subElements.includes("all")) return this.inlines();
        l = [...l, ...parent.sub(Inline).filter((x) => x instanceof Inline)];
      }
      const named = names.filter((x) => x instanceof Inline);
      const byName = names.filter((x) => typeof x === "string" && x !== "all" && x !== "inherit").map((n) => this.resolve(n));
      return [...l, ...named, ...byName];
    }
  };
  function splicehtmlmap(f, html) {
    return transformleaves(f, html, false);
  }
  function defrag(tree) {
    return coalesce((n) => value(n)[0] === "<>" || value(n)[0] === "", tree);
  }
  var compileCache = /* @__PURE__ */ new WeakMap();
  function compileInlines(registry, element, parent) {
    const slot = compileCache.get(registry);
    const map3 = slot?.rev === registry.rev ? slot.map : /* @__PURE__ */ new Map();
    if (slot?.rev !== registry.rev) compileCache.set(registry, { rev: registry.rev, map: map3 });
    const key = element.subElements.includes("inherit") ? `${element.name}<-${parent?.name ?? ""}` : element.name;
    const hit = map3.get(key);
    if (hit) return hit;
    const subinline = registry.inline_subscriptions(element.sub(Inline), parent);
    const inlines = subinline.map((x) => [x.regex, x.parse, x]);
    const esc = [...new Set(subinline.flatMap((x) => [...x.escape]))].join("").replace(/[\]\\^-]/g, "\\$&");
    const unescape = esc.length > 0 ? (t) => t.replace(new RegExp(String.raw`\\([${esc}])`, "g"), "$1") : (t) => t;
    const patt = inlines.length === 0 ? /(?!)/ : new RegExp(inlines.map((x) => `(?:${typeof x[0] === "string" ? x[0] : x[0].source})`).join("|"), "sgm");
    let acc = 0;
    const groupcursors = [0, ...subinline.map((x) => (acc += num_groups(x.regex), acc))];
    const compiled = { inlines, patt, unescape, groupcursors };
    map3.set(key, compiled);
    return compiled;
  }
  function parseinlineBits(registry, _element, text, parent) {
    if (text === "") return [];
    const element = registry.resolve(_element);
    const { inlines, patt, unescape, groupcursors } = compileInlines(registry, element, parent);
    if (inlines.length === 0) return [unescape(text)];
    const l = [];
    let ind = 0;
    for (const match of text.matchAll(patt)) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > ind) l.push(unescape(text.slice(ind, start)));
      ind = end;
      const allgroups = Array.from(match).slice(1);
      const groupind = allgroups.findIndex((x) => x !== void 0);
      if (groupind < 0) continue;
      const pattind = groupcursors.findIndex((x) => x > groupind) - 1;
      const [, parser, elem] = inlines[pattind];
      const groups = allgroups.slice(groupcursors[pattind], groupcursors[pattind + 1] ?? Infinity);
      const wrap = (html) => ({ html, display: elem.display });
      switch (elem.nest) {
        case 0 /* FRAME */:
          l.push(wrap(splicehtmlmap((t) => parseinline(registry, element, t, parent), parser(groups))));
          break;
        case 3 /* NONE */:
          l.push(wrap(parser(groups)));
          break;
        case 1 /* POST */: {
          const inheritQ = elem.sub(Inline).includes("inherit");
          l.push(wrap(splicehtmlmap(
            (t) => parseinline(registry, inheritQ ? element : elem, t, inheritQ ? parent : element),
            parser(groups)
          )));
          break;
        }
        case 2 /* SUB */:
          l.push(wrap([["", {}], `why does your inline element ${elem.name} have nesting = Nesting.SUB?`]));
          break;
      }
    }
    if (ind < text.length) l.push(unescape(text.slice(ind)));
    return l;
  }
  function parseinline(registry, _element, text, parent) {
    return parseinlineBits(registry, _element, text, parent).map((b) => typeof b === "string" ? b : b.html);
  }
  function check(test) {
    return (function(value2) {
      if (test instanceof RegExp) return value2.match(test)?.groups;
      return test === value2 ? { name: test } : void 0;
    });
  }
  var BLOCK_START = /^----*(?<name>[a-z][a-z0-9-]*)\s*(?<args>\S[\w_=\- \.@$%*!#,]+)?$/;
  var BLOCK_END = /^(?<dummy>\.\.\.\.*)\s*$/;
  function splitblocks1(text) {
    return forestify1(check(BLOCK_START), check(BLOCK_END), text.split("\n")).map(
      (node) => !isLeaf(node) && node.length === 1 ? [...node, ""] : node
    );
  }
  var SLOT = /(\[\|\|?\d+\|?\|])/;
  var SLOT_FULL = /^\[\|\|?(\d+)\|?\|]$/;
  function expandSlots(leaf, slots) {
    return leaf.split(SLOT).filter((x) => x !== "").map((part) => {
      const m = part.match(SLOT_FULL);
      return m ? slots[+m[1]] : part;
    });
  }
  function subprepare(registry, block2, text, parent) {
    const lexed = splitblocks1(text);
    const slots = [];
    const body = lexed.map((node) => {
      if (!isLeaf(node)) {
        slots.push(parseNode(registry, node, block2));
        return `[||${slots.length - 1}||]`;
      }
      return parseinlineBits(registry, block2, node, parent).map((bit) => {
        if (typeof bit === "string") return bit;
        slots.push(bit.html);
        return bit.display === 0 /* BLOCK */ ? `[||${slots.length - 1}||]` : `[|${slots.length - 1}|]`;
      }).join("");
    }).join("\n");
    return { body, slots };
  }
  function resolveTop(registry, top) {
    const e = top == null ? registry.top : typeof top === "string" ? registry.resolve(top) : top;
    if (!e || !(e instanceof Block)) {
      throw Error("No top block. Pass a Block as the third argument or set registry.top.");
    }
    return e;
  }
  function parse(registry, input, top) {
    if (typeof input === "string") {
      const block2 = resolveTop(registry, top);
      return parseNode(registry, [{ name: block2.name, args: "" }, input], block2);
    }
    return parseNode(registry, input, typeof top === "string" ? registry.resolve(top) : top);
  }
  function parseNode(registry, ast, parent) {
    if (!isLeaf(ast)) {
      if (isTag(ast)) {
        return defrag(construct(value(ast), branch(ast).map((node) => parseNode(registry, node, parent))));
      } else if (ast.length >= 2 && type_default(value(ast)) === "Object" && all_default((x) => type_default(x) === "String", ast.slice(1))) {
        const block2 = registry.resolve(value(ast).name);
        if (!(block2 instanceof Block)) throw Error(`Something strange happened: ${block2} is not a Block. while parsing
${ast}`);
        const text = ast.slice(1).join("\n");
        const raw = (value(ast).args ?? "").trim();
        const opts = parseArgs(raw ? raw.split(/\s+/) : [], block2.opts);
        switch (block2.nest) {
          case 3 /* NONE */:
            return defrag(block2.parse(text, opts));
          case 1 /* POST */: {
            const parsed = block2.parse(text, opts);
            return defrag(construct(value(parsed), branch(parsed).map((node) => parseNode(registry, node, block2))));
          }
          case 2 /* SUB */: {
            const { body, slots } = subprepare(registry, block2, text, parent);
            const parsed = block2.parse(body, opts);
            return defrag(splicehtmlmap((leaf) => expandSlots(leaf, slots), parsed));
          }
          case 0 /* FRAME */: {
            const parsed = block2.parse(text, opts);
            return defrag(construct(value(parsed), branch(parsed).map((node) => parseNode(registry, node, parent ?? block2))));
          }
        }
        throw Error(`Something went wrong. Nesting for block ${block2} was not recognized as SUB, POST, NONE, or FRAME. while parsing:
 ${ast}`);
      } else {
        throw Error(`Something strange happened
${ast}
isn't a recognized format for parsing.`);
      }
    } else {
      if (!realQ(parent)) throw Error(`Something strange happened, you're trying to parse a string without a parent block context. ${parent}
${ast}`);
      if (parent && parent.nest === 1 /* POST */) {
        const p1 = splitblocks1(ast);
        if (!(p1.length === 1 && p1[0] === ast)) {
          return defrag([["<>", {}], ...p1.map((x) => parseNode(registry, x, parent))]);
        }
      }
      return [["<>", {}], ...parseinline(registry, parent, ast)];
    }
  }

  // src/html.ts
  var VOID_TAGS = /* @__PURE__ */ new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]);
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function parseShorthand(shorthand) {
    const parts = shorthand.split(/(?=[#.])/);
    const tag = parts[0];
    let id;
    const classes = [];
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      if (p.startsWith("#")) id = p.slice(1);
      else if (p.startsWith(".")) classes.push(p.slice(1));
    }
    return { tag, id, classes };
  }
  function camelToKebab(s) {
    return s.replace(/([A-Z])/g, (m) => "-" + m.toLowerCase());
  }
  function serializeStyle(style) {
    return Object.entries(style).map(([k, v]) => `${camelToKebab(k)}:${v}`).join(";");
  }
  function renderAttrs(shorthandClasses, shorthandId, attrs) {
    const parts = [];
    const id = attrs.id != null ? attrs.id : shorthandId;
    if (id != null) parts.push(`id="${escapeHtml(String(id))}"`);
    const explicitClass = attrs.class ? String(attrs.class).split(/\s+/) : [];
    const allClasses = [...shorthandClasses, ...explicitClass];
    if (allClasses.length > 0) parts.push(`class="${allClasses.join(" ")}"`);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === "id" || key === "class") continue;
      if (key === "style" && typeof val === "object" && val !== null) {
        parts.push(`style="${serializeStyle(val)}"`);
      } else if (val === true) {
        parts.push(key);
      } else if (val === false || val == null) {
      } else {
        parts.push(`${key}="${escapeHtml(String(val))}"`);
      }
    }
    return parts.length > 0 ? " " + parts.join(" ") : "";
  }
  function render(node) {
    if (typeof node === "string") return escapeHtml(node);
    if (isLeaf(node)) return escapeHtml(node);
    const head = node[0];
    const [shorthand, attrs] = head;
    const { tag: parsedTag, id, classes } = parseShorthand(shorthand);
    const tag = parsedTag || "div";
    const attrStr = renderAttrs(classes, id, attrs);
    const children = node.slice(1).filter((c) => c != null);
    if (tag === "" || tag === "<>") {
      return children.map((child) => render(child)).join("");
    }
    if (VOID_TAGS.has(tag)) {
      return `<${tag}${attrStr}>`;
    }
    const inner = children.map((child) => render(child)).join("");
    return `<${tag}${attrStr}>${inner}</${tag}>`;
  }

  // src/library.ts
  var Bold = IdenticalInline("bold", "*", "strong");
  var Italic = IdenticalInline("italic", "_", "em");
  var Monospace = IdenticalInline("monospace", "`", "code");
  var Underline = SingleGroupInline("underline", "__", "__", "u");
  var Strikethrough = IdenticalInline("strikethrough", "~", "del");
  var Superscript = SingleGroupInline("superscript", "^{", "}", "sup");
  var Subscript = SingleGroupInline("subscript", "_{", "}", "sub");
  var Link = link("")(function link2(groups) {
    const href = groups[1];
    return [["a", { href, target: href.startsWith("http") ? "_blank" : "_self" }], groups[0]];
  });
  var FullImage = link("!!", 3 /* NONE */)(function fullImage(groups) {
    return [["img.full-image", {
      alt: groups[0],
      src: groups[1],
      style: { display: "block", margin: "0 auto", maxWidth: "100%" }
    }]];
  });
  var InlineImage = link("!", 3 /* NONE */)(function inlineImage(groups) {
    return [["img.inline-image", { alt: groups[0], src: groups[1], style: { display: "inline-block", verticalAlign: "middle", maxWidth: "100%" } }]];
  });
  var Tooltip = withAssets(
    link("T", 1 /* POST */)(function tooltip(groups) {
      return [["span.tooltip", { title: groups[1] }], groups[0]];
    }),
    assetInline(1 /* CSS */, ".tooltip { border-bottom: 1px dotted currentColor; cursor: help; }")
  );
  var Classed = link("\\.", 1 /* POST */)(function classed(groups) {
    return [["span", { class: groups[0] }], groups[1]];
  });
  var TagBasic = inline(Patterns.tag_simple, function tagBasic(groups) {
    return [[groups[0] + (groups[1] || ""), {}], groups[2]];
  }, 1 /* POST */);
  var Audio = inline(
    /@\{([^}]+)\}/,
    function audio(groups) {
      return [["audio", { controls: true, src: groups[0] }], "Audio is not supported on your browser."];
    },
    3 /* NONE */,
    "@",
    []
  );
  var Header = inline(
    /^(#{1,6})([^\n]*)$/,
    function header(groups) {
      const title = groups[1].trimStart();
      return [[`h${groups[0].length}`, {}], [["a.anchor", { id: slug(groups[1]) }], title]];
    },
    1 /* POST */,
    "#",
    ["all"],
    0 /* BLOCK */
  );
  var MDStarBold = MirrorInline("mdStarBold", "**", "strong");
  var MDLodashBold = MirrorInline("mdLodashBold", "__", "strong");
  var MDStarItalic = MirrorInline("mdStarItalic", "*", "em");
  var MDLodashItalic = MirrorInline("mdLodashItalic", "_", "em");
  var NoopBlock = block()(function noopBlock(text) {
    return [["div", {}], text];
  });
  var Paragraphs = block(2 /* SUB */)(function paragraphs(text) {
    const paras = [];
    for (const chunk of text.split(/(?:^|\n)(\[\|\|\d+\|\|\])/m)) {
      if (!chunk) continue;
      if (/^\[\|\|\d+\|\|\]$/.test(chunk.trim())) {
        paras.push(chunk.trim());
        continue;
      }
      for (const p of chunk.split("\n\n")) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        paras.push([["p", {}], trimmed]);
      }
    }
    return [["div.paragraphs", {}], ...paras];
  });
  function restyle(tag, name) {
    const [, attrs] = tag[0];
    return [[name, attrs], ...tag.slice(1)];
  }
  var Aside = block(2 /* SUB */)(function aside(text) {
    return restyle(Paragraphs.parse(text), "aside");
  });
  var Blockquote = withAssets(
    block(2 /* SUB */)(function blockquote(text) {
      return restyle(Paragraphs.parse(text), "blockquote");
    }),
    assetInline(1 /* CSS */, `blockquote {
  margin-left: 10px;
  padding-left: 5px;
  font-size: 1.15em;
  border-left: 5px solid gray;
}`)
  );
  var HLJS = "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build";
  var Code = withAssets(
    terminal_block()(function code(text, opts) {
      const lang = String(opts?._?.[0] ?? opts?.language ?? "");
      return [["pre", {}], [[`code${lang ? ".language-" + lang : ""}`, {}], text]];
    }),
    assetUrl(1 /* CSS */, `${HLJS}/styles/atom-one-light.min.css`),
    assetUrl(0 /* JS */, `${HLJS}/highlight.min.js`)
  );
  var HorizontalRule = terminal_block()(function horizontalRule() {
    return [["hr", {}]];
  });
  var SideBySide = block(1 /* POST */)(function sideBySide(text) {
    const rows = text.replace(/\n$/, "").split("\n").map((l) => splitUnescaped(l, "|"));
    const cols = zipLongest(rows, "").map((col) => [["div", { style: { flex: "1" } }], col.join("\n")]);
    return [["div.side-by-side", { style: { display: "flex" } }], ...cols];
  });
  var Matrix = withAssets(
    block(1 /* POST */)(function matrix(text, opts) {
      const type3 = String(opts?._?.[0] ?? opts?.type ?? "flex");
      const flex = type3 === "flex";
      const rows = text.split("\n").filter((l) => l.trim() !== "").map((l) => {
        const cells = splitUnescaped(l, "|").map((c) => [[flex ? "span" : "td", flex ? { style: { flex: 1 } } : {}], c]);
        return [[flex ? "div" : "tr", flex ? { style: { display: "flex" } } : {}], ...cells];
      });
      return [[flex ? "div.matrix.matrix-flex" : "table.matrix.matrix-table", {}], ...rows];
    }),
    assetInline(1 /* CSS */, ".matrix { margin: 0 auto; }")
  );
  var Figure = block(1 /* POST */)(function figure(text) {
    const i = text.indexOf("\n\n");
    const [caption, body] = i < 0 ? [void 0, text] : [text.slice(0, i), text.slice(i + 2)];
    return [["figure", {}], body, ...caption ? [[["figcaption", {}], caption]] : []];
  });
  var Youtube = withAssets(
    terminal_block()(function youtube(url) {
      return [["div.video", {}], [["iframe", {
        src: url.trim(),
        frameborder: "0",
        allow: "encrypted-media; picture-in-picture",
        allowfullscreen: true
      }]]];
    }),
    assetInline(1 /* CSS */, `.video {
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
  );
  var Video = terminal_block()(function video(url) {
    return [["video", { controls: true }], [["source", { src: url.trim() }]], "Your browser does not support the video tag."];
  });
  var KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist";
  var Katex = withAssets(
    terminal_block()(function katex(text) {
      return [["div.katex", {}], text];
    }),
    assetUrl(1 /* CSS */, `${KATEX}/katex.min.css`),
    assetUrl(0 /* JS */, `${KATEX}/katex.min.js`),
    assetInline(1 /* CSS */, ".katex { position: relative; }")
  );
  var Mermaid = withAssets(
    terminal_block()(function mermaid(text) {
      return [["div.mermaid", {}], text];
    }),
    assetUrl(0 /* JS */, "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js")
  );
  function processList(l, root) {
    if (Array.isArray(l[0])) {
      throw new Error("Sublist found as first element of the list. Sublists must come after another list element.");
    }
    const acc = [[root, {}]];
    for (const e of l) {
      if (typeof e === "string") acc.push([["li", {}], e]);
      else acc[acc.length - 1].push(processList(e, root));
    }
    return acc;
  }
  function parseListItems(text) {
    if (!text || text.trim() === "") return void 0;
    const items = [];
    const pos = [-1];
    for (const line of text.split("\n")) {
      if (line.trim() === "") continue;
      const p = line.length - line.replace(/^ +/, "").length;
      const content = line.trim().replace(/^([-*+]|\d+\.)\s+/, "");
      if (p > pos[pos.length - 1]) {
        items.push([content]);
        pos.push(p);
      } else if (p < pos[pos.length - 1]) {
        while (p < pos[pos.length - 1]) {
          const item = items.pop();
          items[items.length - 1].push(item);
          pos.pop();
        }
        items[items.length - 1].push(content);
        if (pos[pos.length - 1] !== p) pos.push(p);
      } else {
        items[items.length - 1].push(content);
      }
    }
    while (items.length > 1) {
      items[items.length - 2].push(items[items.length - 1]);
      items.pop();
    }
    return items[0];
  }
  function listTag(text, ordered) {
    const items = parseListItems(text);
    if (!items) return [[ordered ? "ol" : "ul", {}]];
    return processList(items, ordered ? "ol" : "ul");
  }
  var List = block(1 /* POST */, ["all"], { o: false })(function list(text, opts) {
    return listTag(text, !!(opts?.o || opts?._?.[0] === "o"));
  });
  var UnorderedList = block(1 /* POST */)(function unorderedList(text) {
    return listTag(text, false);
  });
  var OrderedList = block(1 /* POST */)(function orderedList(text) {
    return listTag(text, true);
  });
  var CriticAdd = MirrorInline("criticAdd", "{++", "ins");
  var CriticDel = MirrorInline("criticDel", "{--", "del");
  var CriticHighlight = MirrorInline("criticHighlight", "{==", "mark");
  var CriticComment = MirrorInline("criticComment", "{>>", "span.critic.comment");
  var CriticSub = inline_two("{~~", "~>", "~~}")(function criticSub(groups) {
    return [["span.critic.sub", {}], [["del", {}], groups[0]], [["ins", {}], groups[1]]];
  });
  var StandardInline = new Registry([
    Underline,
    Bold,
    Italic,
    Monospace,
    Strikethrough,
    Superscript,
    Subscript,
    TagBasic,
    Classed,
    Link,
    FullImage,
    InlineImage,
    Tooltip,
    Audio,
    Header
  ]);
  var MarkdownInline = StandardInline.minus([Bold, Italic, Underline]).plus([MDStarBold, MDLodashBold, MDStarItalic, MDLodashItalic]);
  var CriticMarkup = new Registry([
    CriticSub,
    CriticAdd,
    CriticDel,
    CriticComment,
    CriticHighlight
  ]);
  var blocks = [
    Aside,
    Blockquote,
    List,
    UnorderedList,
    OrderedList,
    SideBySide,
    Matrix,
    Figure,
    Youtube,
    Video,
    Code,
    HorizontalRule,
    Katex,
    Mermaid,
    NoopBlock
  ];
  var Standard = new Registry([Paragraphs], { top: Paragraphs }).merge(StandardInline).merge(CriticMarkup).plus(blocks);
  var StandardExtended = Standard.clone();
  var Markdown = new Registry([Paragraphs], { top: Paragraphs }).merge(MarkdownInline).merge(CriticMarkup).plus(blocks);

  // src/index.ts
  function toHTML(text, registry = Standard, top) {
    return render(parse(registry, text, top));
  }

  // src/browser.ts
  var jsdom = () => typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
  async function injectAssets(registry) {
    if (typeof document === "undefined") return;
    if (document.querySelector('meta[name="glue-assets"]')) return;
    const html = registry.assets();
    if (!html) return;
    const meta = document.createElement("meta");
    meta.setAttribute("name", "glue-assets");
    document.head.append(meta);
    const box = document.createElement("template");
    box.innerHTML = html;
    const wait = [];
    for (const node of [...box.content.childNodes]) {
      if (!(node instanceof Element)) continue;
      if (node instanceof HTMLScriptElement) {
        const s = document.createElement("script");
        for (const a of Array.from(node.attributes)) s.setAttribute(a.name, a.value);
        s.async = false;
        if (!s.src) s.textContent = node.textContent;
        else if (!jsdom()) {
          wait.push(new Promise((res) => {
            s.addEventListener("load", () => res(), { once: true });
            s.addEventListener("error", () => res(), { once: true });
          }));
        }
        document.head.append(s);
      } else {
        document.head.append(node);
      }
    }
    if (wait.length) await Promise.all(wait);
  }
  async function enhance(root = document) {
    if (typeof window === "undefined") return;
    const w = window;
    root.querySelectorAll(".katex").forEach((el) => {
      if (!w.katex || el.querySelector(".katex-html, .katex-mathml")) return;
      const tex = el.textContent ?? "";
      try {
        w.katex.render(tex.trim(), el, { throwOnError: false, displayMode: true });
      } catch {
      }
    });
    if (w.hljs) {
      root.querySelectorAll("pre code").forEach((el) => {
        if (!el.classList.contains("hljs")) w.hljs.highlightElement(el);
      });
    }
    if (w.mermaid) {
      w.mermaid.initialize({ startOnLoad: false, theme: "neutral" });
      const nodes = [...root.querySelectorAll(".mermaid")].filter((n) => !n.querySelector("svg"));
      if (nodes.length) await w.mermaid.run({ nodes });
    }
  }
  function renderAll(options = {}) {
    const {
      registry = StandardExtended,
      top = "paragraphs",
      selector = 'script[type="glue"]'
    } = options;
    const pending = injectAssets(registry);
    document.querySelectorAll(selector).forEach((script) => {
      const text = script.textContent ?? "";
      const html = toHTML(text, registry, top);
      const fragment = document.createRange().createContextualFragment(html);
      script.parentNode?.insertBefore(fragment, script.nextSibling);
    });
    return pending.then(() => enhance(document));
  }
  async function renderElement(el, options = {}) {
    const { registry = StandardExtended, top = "paragraphs" } = options;
    el.innerHTML = toHTML(el.textContent ?? "", registry, top);
    await injectAssets(registry);
    await enhance(el);
  }
  return __toCommonJS(browser_exports);
})();
