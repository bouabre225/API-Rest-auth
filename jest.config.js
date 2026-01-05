export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^#lib/(.*)$': '<rootDir>/src/lib/$1',
    '^#controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^#services/(.*)$': '<rootDir>/src/services/$1',
    '^#middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^#routes/(.*)$': '<rootDir>/src/routes/$1',
    '^#schemas/(.*)$': '<rootDir>/src/schemas/$1',
    '^#dto/(.*)$': '<rootDir>/src/dto/$1',
  },
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
};
