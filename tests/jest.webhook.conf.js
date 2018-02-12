const baseConfig = require('./jest.base.conf.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './tests/support/tearup-basic.js',
  testMatch: ['**/tests/webhook/**/*.spec.js?(x)'],
  collectCoverage: false,
  coverageDirectory: 'tests/coverage/webhook',
  collectCoverageFrom: ['webhook/**/*.js']
})
