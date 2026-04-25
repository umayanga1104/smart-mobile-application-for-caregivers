/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',

  // Babel transforms ESM → CJS so Jest can run ES-module source files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Where to find tests
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
  ],

  // Runs before tests – sets environment variables so no module crashes on init
  setupFiles: ['./tests/setup.js'],

  // Per-test timeout (applies globally; integration tests may be slow)
  testTimeout: 60000,

  // Coverage
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // Separate projects so unit and integration suites can be run independently
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'node',
      transform: { '^.+\\.js$': 'babel-jest' },
      setupFiles: ['<rootDir>/tests/setup.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      transform: { '^.+\\.js$': 'babel-jest' },
      setupFiles: ['<rootDir>/tests/setup.js'],
    },
  ],
};
