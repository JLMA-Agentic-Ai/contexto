/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test utilities
global.testTimeout = 10000;
global.mockApiKey = 'test-api-key-12345';
global.mockBaseUrl = 'http://localhost:8080';

// Mock external dependencies
jest.mock('@claude-flow/cli', () => ({
  SwarmManager: jest.fn().mockImplementation(() => ({
    init: jest.fn().mockResolvedValue({ success: true }),
    spawnAgent: jest.fn().mockResolvedValue({ success: true, data: { id: 'test-agent-123', type: 'coder' } }),
    terminateAgent: jest.fn().mockResolvedValue({ success: true }),
    getAgentStatus: jest.fn().mockResolvedValue({ success: true, data: { status: 'active' } })
  })),
  MemoryManager: jest.fn().mockImplementation(() => ({
    store: jest.fn().mockResolvedValue({ success: true }),
    retrieve: jest.fn().mockResolvedValue({ success: true, data: { test: 'value' } }),
    search: jest.fn().mockResolvedValue({ success: true, data: [] })
  })),
  TaskManager: jest.fn().mockImplementation(() => ({
    createTask: jest.fn().mockResolvedValue({ success: true, data: { id: 'task-123', status: 'pending' } }),
    updateTask: jest.fn().mockResolvedValue({ success: true }),
    getTaskStatus: jest.fn().mockResolvedValue({ success: true, data: { status: 'completed' } })
  }))
}));

// Mock axios for HTTP calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    post: jest.fn().mockResolvedValue({ status: 200, data: { success: true, id: 'mock-id' } }),
    put: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
  post: jest.fn().mockResolvedValue({ status: 200, data: { success: true, id: 'mock-id' } }),
  put: jest.fn().mockResolvedValue({ status: 200, data: { success: true } }),
  delete: jest.fn().mockResolvedValue({ status: 200, data: { success: true } })
}));

// Mock WebSocket for real-time connections
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);

// Mock filesystem operations
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{"test": "data"}'),
  exists: jest.fn().mockResolvedValue(true),
  remove: jest.fn().mockResolvedValue(undefined),
  copy: jest.fn().mockResolvedValue(undefined)
}));

// Mock Redis client
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue('test-value'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG')
  }));
});

// Mock Database connections
jest.mock('kuzu', () => ({
  Database: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      columns: ['s'],
      data: [{ s: { id: 1, name: 'test-symbol', type: 'function' } }]
    }),
    close: jest.fn().mockResolvedValue(undefined)
  })),
  Connection: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      columns: ['s'],
      data: [{ s: { id: 1, name: 'test-symbol', type: 'function' } }]
    })
  }))
}));

// Mock Bull queue
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined)
  }));
});

// Console suppression for cleaner test output
const originalConsole = console;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console for specific tests that need it
export const restoreConsole = () => {
  global.console = originalConsole;
};

// Test helper functions
export const createMockBridgeConfig = (overrides: any = {}) => ({
  name: 'test-bridge',
  version: '1.0.0',
  enabled: true,
  timeout: 10000,
  retryAttempts: 3,
  circuitBreakerThreshold: 5,
  healthCheckInterval: 30000,
  ...overrides
});

export const createMockTask = (overrides: any = {}) => ({
  id: 'task-123',
  type: 'test',
  title: 'Test Task',
  description: 'Test task description',
  priority: 'medium',
  status: 'pending',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});