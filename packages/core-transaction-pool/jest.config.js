'use strict'

module.exports = {
  testEnvironment: 'node',
  bail: false,
  verbose: true,
  silent: true,
  testMatch: [
    '**/__tests__/**/*.test.js'
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
  setupTestFrameworkScriptFile: 'jest-extended'
}
