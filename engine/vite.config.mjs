import { defineConfig, configDefaults } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@api': path('src/api'),
      '@sdk': path('src/sdk'),
      '@core': path('src/core'),
      '@test': path('src/test')
    }
  },
  test: {
    poolOptions: {
      forks: {
        execArgv: [
          '--disable-proto=throw',
          // '--permission',
          '--throw-deprecation'
        ]
      }
    },
    exclude: [...configDefaults.exclude],
    coverage: {
      exclude: [
        'dist/**',
        'eslint.config.mjs',
        'vite.config.mjs',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'src/engine.ts',
        'src/api/interfaces/**',
        '!src/api/interfaces/IReadOnlyArray.ts',
        '!src/api/interfaces/IReadOnlyDictionary.ts',
        'src/api/values/**',
        'src/sdk/exceptions/**',
        '!src/sdk/exceptions/BaseException.ts',
        'src/test/**',
        'tools/**'
      ]
    }
  }
});
