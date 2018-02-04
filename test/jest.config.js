const baseConfig = require('./jest.base.js')

module.exports = Object.assign(baseConfig, {
  testMatch: ['**/test/api/**/*.spec.js?(x)', '**/test/unit/**/*.spec.js?(x)'],
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
})
