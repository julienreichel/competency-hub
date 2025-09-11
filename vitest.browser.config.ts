import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    // Browser mode configuration
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
      // Support for component testing
      fileParallelism: false,
    },
    globals: true,
    // Use a different setup file for browser tests
    setupFiles: ['./test/setup-browser.ts'],
    // Include patterns for component tests
    include: ['./test/components/**/*.{test,spec}.{js,ts}'],
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
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      src: resolve(__dirname, './src'),
    },
  },
});
