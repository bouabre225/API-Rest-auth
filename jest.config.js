export default {
  testEnvironment: '<rootDir>/tests/jest-environment.cjs',
  globalSetup: '<rootDir>/tests/globalSetup.js',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    '^#lib/(.*)$': '<rootDir>/src/lib/$1.js',
    '^#controllers/(.*)$': '<rootDir>/src/controllers/$1.js',
    '^#services/(.*)$': '<rootDir>/src/services/$1.js',
    '^#middlewares/(.*)$': '<rootDir>/src/middlewares/$1.js',
    '^#routes/(.*)$': '<rootDir>/src/routes/$1.js',
    '^#schemas/(.*)$': '<rootDir>/src/schemas/$1.js',
    '^#dto/(.*)$': '<rootDir>/src/dto/$1.js',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  injectGlobals: true,
};
