// Jest setup file
Object.defineProperty(global, 'fetch', {
  value: jest.fn(),
  writable: true
});

// Mock process.env
process.env.NODE_ENV = 'test';
