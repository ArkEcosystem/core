const baseConfig = require('../jest.config.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './tests/support/tearup-basic.js',
  testMatch: ['**/tests/webhooks/**/*.spec.js'],
  coverageDirectory: 'tests/coverage/webhook',
  collectCoverageFrom: ['webhook/**/*.js'],
  verbose: true
})
