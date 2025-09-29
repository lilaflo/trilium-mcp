import { jest } from '@jest/globals';

// Mock environment variables
process.env.TRILIUM_URL = 'https://test-trilium.example.com/etapi';
process.env.TRILIUM_TOKEN = 'test-token-123';
process.env.NODE_ENV = 'test';

// Global fetch mock setup
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Console mock to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});