module.exports = {
  testEnvironment: 'node',
  bail: false,
  verbose: false,
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/.coverage',
  collectCoverageFrom: ['lib/**/*.js', '!**/node_modules/**'],
  watchman: false,
  setupTestFrameworkScriptFile: 'jest-extended',
}
