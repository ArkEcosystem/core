const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../'),

  globalSetup: 'tests/support/tearup-full.js',
  // globalTeardown: 'tests/support/teardown.js',

  testEnvironment: 'node',
  bail: true,
  verbose: true,

  setupFiles: ['<rootDir>/__tests__/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/__tests__/support/setup-framework',

  collectCoverage: false,
  coverageDirectory: 'tests/coverage/all',
  collectCoverageFrom: [
    'src/api/**/*.js',
    'src/config/**/*.js',
    'src/**/*.js',
    'src/database/**/*.js',
    'src/utils/**/*.js'
  ]
}
