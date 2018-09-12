module.exports = {
  bail: false,
  verbose: true,
  testEnvironment: 'node',
  testMatch: [
    '**/packages/client/**/__tests__/**/*.test.js',
    '**/packages/core-api/**/__tests__/**/*.test.js',
    '**/packages/core-blockchain/**/__tests__/**/*.test.js',
    '**/packages/core-config/**/__tests__/**/*.test.js',
    '**/packages/core-container/**/__tests__/**/*.test.js',
    '**/packages/core-database/**/__tests__/**/*.test.js',
    '**/packages/core-deployer/**/__tests__/**/*.test.js',
    '**/packages/core-event-emitter/**/__tests__/**/*.test.js',
    '**/packages/core-forger/**/__tests__/**/*.test.js',
    // '**/packages/core-graphql/**/__tests__/**/*.test.js',
    // '**/packages/core-json-rpc/**/__tests__/**/*.test.js',
    '**/packages/core-logger-winston/**/__tests__/**/*.test.js',
    '**/packages/core-logger/**/__tests__/**/*.test.js',
    '**/packages/core-p2p/**/__tests__/**/*.test.js',
    '**/packages/core-test-utils/**/__tests__/**/*.test.js',
    '**/packages/core-tester-cli/**/__tests__/**/*.test.js',
    '**/packages/core-transaction-pool-redis/**/__tests__/**/*.test.js',
    '**/packages/core-transaction-pool/**/__tests__/**/*.test.js',
    '**/packages/core-webhooks/**/__tests__/**/*.test.js',
    '**/packages/crypto/**/__tests__/**/*.test.js',
    '**/packages/validation/**/__tests__/**/*.test.js'
  ],
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
