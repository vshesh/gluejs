import ts from 'typescript'
import { readFile } from 'node:fs/promises'
import type { Plugin as EsbuildPlugin } from 'esbuild'
import type { Plugin as VitePlugin } from 'vite'

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  sourceMap: true,
  isolatedModules: true,
}

export function transpileDecorators(code: string, fileName: string) {
  return ts.transpileModule(code, { compilerOptions, fileName })
}

function needsDecorators(code: string) {
  return /^\s*@[A-Za-z]/m.test(code)
}

/** esbuild cannot parse TS 5 / stage-3 field decorators; tsc can. */
export function esbuildDecoratorPlugin(): EsbuildPlugin {
  return {
    name: 'ts-native-decorators',
    setup(build) {
      build.onLoad({ filter: /\/src\/.*\.ts$/ }, async (args) => {
        const source = await readFile(args.path, 'utf8')
        if (!needsDecorators(source)) return
        const result = transpileDecorators(source, args.path)
        return { contents: result.outputText, loader: 'js' }
      })
    },
  }
}

export function viteDecoratorPlugin(): VitePlugin {
  return {
    name: 'ts-native-decorators',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/src/') || !id.endsWith('.ts')) return
      if (!needsDecorators(code)) return
      const result = transpileDecorators(code, id)
      return { code: result.outputText, map: result.sourceMapText }
    },
  }
}
