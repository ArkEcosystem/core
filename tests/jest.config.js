const path = require('path')

module.exports = {
  globalSetup: 'tests/support/tearup-full.js',
  // globalTeardown: 'tests/support/teardown.js',
  testEnvironment: 'node',
  bail: true,
  verbose: true,
  setupFiles: ['<rootDir>/tests/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/tests/support/setup-framework',
  collectCoverage: false,
  rootDir: path.resolve(__dirname, '../')
}
