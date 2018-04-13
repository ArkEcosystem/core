const baseConfig = require('../jest.config.js')

module.exports = Object.assign(baseConfig, {
  globalSetup: './__tests__/support/tearup-basic.js',
  testMatch: ['**/__tests__/unit/**/*.spec.js'],
  coverageDirectory: 'tests/coverage/unit',
  collectCoverageFrom: [
    'src/config/**/*.js',
    'src/**/*.js',
    'src/database/**/*.js',
    'src/utils/**/*.js'
  ]
})
