'use strict'

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
    'lib/api/**/*.js',
    'lib/config/**/*.js',
    'lib/**/*.js',
    'lib/database/**/*.js',
    'lib/utils/**/*.js'
  ]
}
