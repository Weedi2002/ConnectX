/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.json' }],
  },
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/e2e/'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/config/*.js'],
  coverageDirectory: 'coverage',
  setupFiles: ['./jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
  moduleNameMapper: {
    '^../queues/email\\.queue\\.js$': '<rootDir>/__mocks__/queues/email.queue.js',
    '^../queues/notification\\.queue\\.js$': '<rootDir>/__mocks__/queues/notification.queue.js',
    '^../queues/media\\.queue\\.js$': '<rootDir>/__mocks__/queues/media.queue.js',
    '^../queues/index\\.js$': '<rootDir>/__mocks__/queues/index.js',
  },
};
