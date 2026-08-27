import { defineConfig } from 'tsup'
import { esbuildDecoratorPlugin } from './decorator-transform'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  esbuildPlugins: [esbuildDecoratorPlugin()],
})
