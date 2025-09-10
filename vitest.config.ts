import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        'amplify/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '.amplify/',
        '.quasar/',
        'src/App.vue',
        'src/boot/**',
        'src/i18n/**',
        'src/layouts/**',
        'src/pages/**',
        'src/router/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // High thresholds for domain models (excluding infrastructure)
        'src/models/User.ts': {
          branches: 95,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        'src/models/Competency.ts': {
          branches: 90,
          functions: 100,
          lines: 95,
          statements: 95,
        },
        // Repository layer thresholds
        'src/models/repositories/**': {
          branches: 85,
          functions: 75,
          lines: 80,
          statements: 80,
        },
      },
      // Fail build if coverage thresholds are not met
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
