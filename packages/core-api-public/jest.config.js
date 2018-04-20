'use strict';

module.exports = {
  testEnvironment: 'node',
  bail: true,
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.spec.js'
  ],
  moduleFileExtensions: [
    'js',
    'json'
  ],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/.coverage',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!**/node_modules/**'
  ],
  watchman: false,
  globalSetup: './__tests__/setup.js',
  setupTestFrameworkScriptFile: 'jest-extended'
}
