import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'amplify/', '**/*.d.ts', '**/*.config.*', 'dist/'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Higher thresholds for critical domain logic
        'src/models/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/models/repositories/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
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
