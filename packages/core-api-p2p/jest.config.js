module.exports = {
  testEnvironment: 'node',
  bail: true,
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.spec.js'
  ],
  moduleFileExtensions: [
    'js',
    'json'
  ],
  coverageDirectory: '<rootDir>/.coverage',
  collectCoverageFrom: [
    'src/**/*.js}',
    '!**/node_modules/**'
  ],
  watchman: false,
  globalSetup: './__tests__/setup.js',
  setupTestFrameworkScriptFile: 'jest-extended'
}
