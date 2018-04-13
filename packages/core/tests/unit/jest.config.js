const baseConfig = require('../jest.config.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './tests/support/tearup-basic.js',
  testMatch: ['**/tests/unit/**/*.spec.js'],
  coverageDirectory: 'tests/coverage/unit',
  collectCoverageFrom: [
    'src/config/**/*.js',
    'src/**/*.js',
    'src/database/**/*.js',
    'src/utils/**/*.js'
  ]
})
