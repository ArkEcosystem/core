module.exports = {
  bail: false,
  verbose: true,
  testEnvironment: 'node',
  testMatch: [ '**/packages/**/__tests__/**/*.test.js' ],
  moduleFileExtensions: [
    'js',
    'json'
  ],
  coverageDirectory: '<rootDir>/.coverage',
  collectCoverageFrom: [
    'packages/**/lib/**/*.js',
    '!**/node_modules/**'
  ],
  watchman: false,
  setupTestFrameworkScriptFile: 'jest-extended'
}
