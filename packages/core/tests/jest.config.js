const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../'),

  globalSetup: 'tests/support/tearup-full.js',
  // globalTeardown: 'tests/support/teardown.js',

  testEnvironment: 'node',
  bail: true,
  verbose: false,

  setupFiles: ['<rootDir>/tests/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/tests/support/setup-framework',

  collectCoverage: false,
  coverageDirectory: 'tests/coverage/all',
  collectCoverageFrom: [
    'src/api/**/*.js',
    'src/config/**/*.js',
    'src/core/**/*.js',
    'src/database/**/*.js',
    'src/utils/**/*.js'
  ]
}
