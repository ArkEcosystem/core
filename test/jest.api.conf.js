const baseConfig = require('./jest.base.conf.js')

module.exports = Object.assign(baseConfig, {
  testMatch: ['**/test/api/**/*.spec.js?(x)'],
  coverageDirectory: 'test/coverage/api',
  collectCoverageFrom: ['api/**/*.js']
})
