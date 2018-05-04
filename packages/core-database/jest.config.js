'use strict'

module.exports = {
  testEnvironment: 'node',
  bail: true,
  verbose: false,
  testMatch: [
    '**/__tests__/**/*.specc.js'
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
