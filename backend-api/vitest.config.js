import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.js'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/controllers/**/*.js', 'src/models/**/*.js', 'src/utils/**/*.js'],
      exclude: [
        // App bootstrap wires middleware, DB startup, static docs, and schedulers; integration smoke covers it.
        'src/app.js',
        // Database schema/bootstrap and scheduled jobs require external PostgreSQL/cron timing.
        'src/models/db.js',
        'src/utils/scheduler.js',
        // External service adapters keep fallback behavior and are validated through service/controller tests.
        'src/utils/wechat.js',
        'src/utils/logger.js'
      ],
      thresholds: {
        // 实测 81.6 / 71.2 / 87.7 / 82.8，阈值贴着实测下沿，防止覆盖率回退。
        statements: 80,
        branches: 70,
        functions: 85,
        lines: 81
      }
    }
  }
})
