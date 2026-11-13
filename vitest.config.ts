import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/api/**/*.ts',
        'src/utils/**/*.ts',
        'src/store/**/*.ts',
        'src/config/**/*.ts',
        'src/pages/**/*.ts'
      ],
      exclude: [
        // Vue SFC templates and uni native bridge code are exercised through page contract tests and extracted TS modules.
        'src/**/*.vue',
        'src/**/*.d.ts',
        // Test assets and fixtures are inputs, not production behavior.
        'src/**/*.{test,spec}.ts',
        'tests/**'
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
})
