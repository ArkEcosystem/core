module.exports = {
    testEnvironment: "node",
    bail: true,
    verbose: true,
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testMatch: ["**/*.test.ts"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "@packages/(.*)$": "<rootDir>/packages/$1",
        "@tests/(.*)$": "<rootDir>/__tests__/$1",
    },
    collectCoverage: false,
    coverageDirectory: "<rootDir>/.coverage",
    collectCoverageFrom: [
        "packages/**/src/**/{!(index|manager),}.ts",
        "!packages/**/src/**/contracts/**",
        "!packages/**/src/**/enums/**",
        "!packages/**/src/**/exceptions/**",
        "!**/node_modules/**",
    ],
    coverageReporters: ["json", "lcov", "text", "clover", "html"],
    watchman: false,
    setupFilesAfterEnv: ["jest-extended"],
};
