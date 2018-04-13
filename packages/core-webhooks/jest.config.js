const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../'),
  testEnvironment: 'node',
  bail: true,
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'tests/coverage/all',
  collectCoverageFrom: [
    'src/**/*.js'
  ]
}
