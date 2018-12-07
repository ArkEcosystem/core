module.exports = {
  testEnvironment: "node",
  bail: false,
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: false,
  coverageDirectory: "<rootDir>/.coverage",
  collectCoverageFrom: ["lib/**/*.ts", "!**/node_modules/**"],
  watchman: false,
  setupTestFrameworkScriptFile: "jest-extended"
};
