module.exports = {
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.spec.js'
  ],
  moduleFileExtensions: [
    'js',
    'json'
  ],
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>/lib/$1'
  // },
  // transform: {
  //   '^.+\\.js$': '<rootDir>/node_modules/babel-jest'
  // },
  coverageDirectory: '<rootDir>/.coverage',
  collectCoverageFrom: [
    'lib/**/*.js',
    '!**/node_modules/**'
  ],
  watchman: false,
  // setupFiles: ['<rootDir>/node_modules/regenerator-runtime/runtime'],
  setupTestFrameworkScriptFile: 'jest-extended'
}
