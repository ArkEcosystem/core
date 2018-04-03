const baseConfig = require('../jest.config.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './tests/support/tearup-full.js',
  testMatch: ['**/tests/api/**/*.spec.js'],
  coverageDirectory: 'tests/coverage/api',
  collectCoverageFrom: ['api/**/*.js'],
  verbose: true
})
