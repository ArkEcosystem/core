const path = require('path')

module.exports = {
  globalSetup: './test/support/tearup.js',
  // globalTeardown: './test/support/teardown.js',

  // env
  testEnvironment: 'node',
  bail: false,
  verbose: false,

  // go from root
  rootDir: path.resolve(__dirname, '../'),

  // setup
  setupFiles: ['<rootDir>/test/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/test/support/setup-framework',

  // coverage
  collectCoverage: true
}
