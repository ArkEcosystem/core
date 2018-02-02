module.exports = {
  globalSetup: './test/support/setup.js',
  globalTeardown: './test/support/teardown.js',

  // env
  testEnvironment: 'node',
  bail: false,
  verbose: false,

  // go from root
  rootDir: '../../',
  testMatch: ['**/test/api/**/*.spec.js?(x)'],

  // setup
  setupFiles: ['<rootDir>/test/support/setup'],
  setupTestFrameworkScriptFile: '<rootDir>/test/support/setup-framework',

  // coverage
  collectCoverage: true,
  coverageDirectory: 'test/coverage/api',
  collectCoverageFrom: ['api/**/*.js']
}
