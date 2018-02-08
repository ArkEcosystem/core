const path = require('path')

module.exports = {
  globalSetup: './tests/support/tearup-full.js',

  // env
  testEnvironment: 'node',
  bail: true,
  verbose: true,

  // go from root
  rootDir: path.resolve(__dirname, '../'),
  testMatch: ['**/tests/api/**/*.spec.js?(x)', '**/tests/unit/**/*.spec.js?(x)'],

  // setup
  setupFiles: ['<rootDir>/tests/support/setup-files'],
  setupTestFrameworkScriptFile: '<rootDir>/tests/support/setup-framework',

  // coverage
  collectCoverage: true,
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
