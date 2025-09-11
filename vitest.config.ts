import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const CI_RETRY_COUNT = 2;

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      // CI-friendly configuration
      screenshotFailures: false,
    },
    // Retry tests in CI environments
    retry: process.env.CI ? CI_RETRY_COUNT : 0,
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
      src: resolve(__dirname, './src'),
    },
  },
});
