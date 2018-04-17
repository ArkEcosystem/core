module.exports = {
  testEnvironment: 'node',
  bail: true,
  verbose: false,
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
  globalSetup: '__tests__/setup.js',
  setupFiles: ['<rootDir>/node_modules/regenerator-runtime/runtime'],
  setupTestFrameworkScriptFile: 'jest-extended'
}
