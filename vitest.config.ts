import { defineConfig } from 'vitest/config'
import { viteDecoratorPlugin } from './decorator-transform'

export default defineConfig({
  plugins: [viteDecoratorPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
