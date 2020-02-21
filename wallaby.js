/* eslint-env node */

module.exports = () => {
    return {
        autoDetect: true,
        tests: [
            "__tests__/unit/core-p2p/transaction-broadcaster.test.ts",
            "__tests__/unit/core-transaction-pool/**/*.test.ts",
        ],
    };
};
