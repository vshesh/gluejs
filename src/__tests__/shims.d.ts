/** Test-only: avoid a @types/node dependency just to read fixtures. */
declare module 'node:fs' {
  export function readFileSync(path: string, encoding?: string): string
}
