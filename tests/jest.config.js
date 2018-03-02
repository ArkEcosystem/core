const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../'),

  globalSetup: 'tests/support/tearup-full.js',
  // globalTeardown: 'tests/support/teardown.js',

  testEnvironment: 'node',
  bail: false,
  verbose: false,

  setupFiles: ['<rootDir>/tests/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/tests/support/setup-framework',

  collectCoverage: false,
  coverageDirectory: 'tests/coverage/all',
  collectCoverageFrom: [
    'app/api/**/*.js',
    'app/config/**/*.js',
    'app/core/**/*.js',
    'app/database/**/*.js',
    'app/model/**/*.js',
    'app/utils/**/*.js'
  ]
}
