import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { glue: 'src/browser.ts' },
  format: ['iife'],
  globalName: 'Glue',
  outDir: 'docs',
  clean: false,
  minify: false,
  sourcemap: false,
  outExtension: () => ({ js: '.js' }),
})
