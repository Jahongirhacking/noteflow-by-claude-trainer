/** @type {import('jest').Config} */
const path = require('path');

const common = {
  rootDir: path.resolve(__dirname, '..'),
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  testEnvironment: 'node',
};

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
    },
    {
      ...common,
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      setupFiles: ['<rootDir>/test/setup/env.ts'],
      globalSetup: '<rootDir>/test/setup/global-setup.ts',
      testTimeout: 30000,
    },
  ],
};
