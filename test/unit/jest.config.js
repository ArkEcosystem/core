const baseConfig = require('../jest.base.js')

module.exports = Object.assign(baseConfig, {
  testMatch: ['**/test/unit/**/*.spec.js?(x)'],
  coverageDirectory: 'test/coverage/unit',
  collectCoverageFrom: [
    'config/**/*.js',
    'core/**/*.js',
    'database/**/*.js',
    'logs/**/*.js',
    'model/**/*.js',
    'storage/**/*.js',
    'utils/**/*.js'
  ]
})
