import { config } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { beforeAll } from 'vitest';

// Global setup for browser mode tests
beforeAll(() => {
  // Configure Vue Test Utils for browser tests
  config.global.plugins = [[Quasar, {}]];

  console.log('Browser test environment initialized with Quasar support');
});

// Add custom matchers or global test utilities here if needed
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    // Add any window extensions for testing here
  }
}
