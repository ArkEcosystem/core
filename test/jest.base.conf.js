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
  testMatch: ['**/test/api/**/*.spec.js?(x)', '**/test/unit/**/*.spec.js?(x)'],

  // setup
  setupFiles: ['<rootDir>/test/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/test/support/setup-framework',

  // coverage
  collectCoverage: true,
  coverageDirectory: 'test/coverage/all',
  collectCoverageFrom: [
    'api/**/*.js',
    'config/**/*.js',
    'core/**/*.js',
    'database/**/*.js',
    'logs/**/*.js',
    'model/**/*.js',
    'storage/**/*.js',
    'utils/**/*.js'
  ]
}
