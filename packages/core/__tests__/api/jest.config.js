const baseConfig = require('../jest.config.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './__tests__/support/tearup-full.js',
  testMatch: ['**/__tests__/api/**/*.spec.js'],
  coverageDirectory: 'tests/coverage/api',
  collectCoverageFrom: ['api/**/*.js'],
  verbose: true
})
