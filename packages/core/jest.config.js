'use strict';

module.exports = {
  globalSetup: './__tests__/support/tearup-full.js',
  // globalTeardown: './__tests__/support/teardown.js',

  testEnvironment: 'node',
  bail: true,
  verbose: true,

  setupFiles: ['<rootDir>/__tests__/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/__tests__/support/setup-framework',

  collectCoverage: false,
  coverageDirectory: './__tests__/coverage/all',
  collectCoverageFrom: [
    'src/api/**/*.js',
    'src/config/**/*.js',
    'src/**/*.js',
    'src/database/**/*.js',
    'src/utils/**/*.js'
  ]
}
