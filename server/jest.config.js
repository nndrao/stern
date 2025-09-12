/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test files patterns
  testMatch: [
    '<rootDir>/src/test/**/*.test.ts',
    '<rootDir>/src/test/**/*.spec.ts'
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1'
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.ts'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage collection patterns
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Error handling
  errorOnDeprecated: true,

  // Watch options
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/logs/',
    '<rootDir>/data/'
  ],

  // Preset for TypeScript support
  preset: 'ts-jest',

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        ignoreCodes: ['TS151001']
      }
    }
  },

  // Test patterns to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],

  // Files to ignore during transformation
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ]
};