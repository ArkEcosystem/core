module.exports = {
  testEnvironment: "node",
  bail: false,
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/packages/**/__tests__/**/*.test.(js|ts)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: false,
  coverageDirectory: "<rootDir>/.coverage",
  collectCoverageFrom: ["packages/**/lib/**/*.js", "packages/**/src/**/*.js", "!**/node_modules/**"],
  watchman: false,
  setupTestFrameworkScriptFile: "jest-extended",
};
