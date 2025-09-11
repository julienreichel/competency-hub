import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
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
