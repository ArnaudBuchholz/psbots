import { defineConfig, configDefaults } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

const path = (rel) => fileURLToPath(new URL(`./${rel}`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@api': path('src/api')
    }
  },
  test: {
    exclude: [...configDefaults.exclude],
    coverage: {
      exclude: [
        'src/**/index.ts',
        'src/api/interfaces/**',
        '!src/api/interfaces/IReadOnlyArray.ts',
        'src/api/values/**'
      ]
    }
  }
})
