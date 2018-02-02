module.exports = {
  // env
  testEnvironment: 'node',
  bail: false,
  verbose: false,

  // go from root
  rootDir: '../../',
  testMatch: ['**/test/api/**/signatures.spec.js?(x)'],

  // setup
  setupFiles: ['<rootDir>/test/support/setup'],
  setupTestFrameworkScriptFile: '<rootDir>/test/support/setup-framework',

  // coverage
  collectCoverage: true,
  coverageDirectory: 'test/coverage/api',
  collectCoverageFrom: ['api/**/*.js']
}
