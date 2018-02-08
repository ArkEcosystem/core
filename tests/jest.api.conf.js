const baseConfig = require('./jest.base.conf.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './tests/support/tearup-full.js',
  testMatch: ['**/tests/api/**/*.spec.js?(x)'],
  coverageDirectory: 'tests/coverage/api',
  collectCoverageFrom: ['api/**/*.js']
})
