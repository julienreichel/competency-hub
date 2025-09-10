import { vi } from 'vitest';

// Mock Amplify client
vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => ({
    models: {
      User: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      Competency: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  })),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
