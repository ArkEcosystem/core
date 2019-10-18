module.exports = {
    testEnvironment: "node",
    bail: false,
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
        "packages/core-kernel/src/**/{!(index|manager),}.ts",
        "!packages/**/src/**/contracts/**",
        "!packages/**/src/**/enums/**",
        "!packages/**/src/**/exceptions/**",
        "!**/node_modules/**",
    ],
    coverageReporters: ["json", "lcov", "text", "clover", "html"],
    // coverageThreshold: {
    //     global: {
    //         branches: 100,
    //         functions: 100,
    //         lines: 100,
    //         statements: 100,
    //     },
    // },
    watchman: false,
    setupFilesAfterEnv: ["jest-extended"],
};
