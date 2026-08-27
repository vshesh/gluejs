import { defineConfig } from 'tsup'
import { esbuildDecoratorPlugin } from './decorator-transform'

export default defineConfig({
  entry: { glue: 'src/browser.ts' },
  format: ['iife'],
  globalName: 'Glue',
  outDir: 'docs',
  clean: false,
  minify: false,
  sourcemap: false,
  target: 'es2022',
  outExtension: () => ({ js: '.js' }),
  esbuildPlugins: [esbuildDecoratorPlugin()],
})
