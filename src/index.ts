export * from "./parser"
export * from "./elements"
export * from "./nestable"
export * from "./html"
export * from "./library"

import { parse, type Registry } from "./parser"
import { render } from "./html"
import { Standard } from "./library"
import type { Block } from "./elements"

/** Parse glue text and render HTML. Default registry is Standard. */
export function toHTML(text: string, registry: Registry = Standard, top?: Block | string): string {
  return render(parse(registry, text, top))
}
