module.exports = {
  // env
  testEnvironment: 'node',
  bail: false,
  verbose: false,

  // go from root
  rootDir: '../../',
  testMatch: ['**/test/unit/**/*.spec.js?(x)'],

  // setup
  setupFiles: ['<rootDir>/test/support/setup'],
  setupTestFrameworkScriptFile: '<rootDir>/test/support/setup-framework',

  // coverage
  collectCoverage: false,
  coverageDirectory: 'test/coverage/unit',
  collectCoverageFrom: [
    'config/**/*.js',
    'core/**/*.js',
    'database/**/*.js',
    'logs/**/*.js',
    'model/**/*.js',
    'storage/**/*.js',
    'utils/**/*.js'
  ]
}
