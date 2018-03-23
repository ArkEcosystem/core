const baseConfig = require('../jest.config.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './tests/support/tearup-basic.js',
  testMatch: ['**/tests/unit/**/*.spec.js'],
  coverageDirectory: 'tests/coverage/unit',
  collectCoverageFrom: [
    'app/config/**/*.js',
    'app/core/**/*.js',
    'app/database/**/*.js',
    'app/model/**/*.js',
    'app/utils/**/*.js'
  ]
})
