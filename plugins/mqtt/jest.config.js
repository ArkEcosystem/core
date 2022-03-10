'use strict'

module.exports = {
    testEnvironment: 'node',
    bail: false,
    verbose: true,
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
    moduleFileExtensions: [
        'js',
        'json'
    ],
    collectCoverage: false,
    coverageDirectory: '<rootDir>/.coverage',
    collectCoverageFrom: [
        'lib/**/*.js',
        '!**/node_modules/**'
    ],
    watchman: false,
    globalSetup: './__tests__/__support__/setup.js',
    setupTestFrameworkScriptFile: 'jest-extended'
}
