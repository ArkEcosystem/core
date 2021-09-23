"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.queries = {
    blocks: {
        heightRange: utils_1.loadQueryFile(__dirname, "./blocks/height-range.sql"),
        latest: utils_1.loadQueryFile(__dirname, "./blocks/latest.sql"),
        findByHeight: utils_1.loadQueryFile(__dirname, "./blocks/find-by-height.sql"),
        deleteFromHeight: utils_1.loadQueryFile(__dirname, "./blocks/delete-from-height.sql"),
    },
    transactions: {
        timestampRange: utils_1.loadQueryFile(__dirname, "./transactions/timestamp-range.sql"),
        timestampHigher: utils_1.loadQueryFile(__dirname, "./transactions/timestamp-higher.sql"),
        deleteFromTimestamp: utils_1.loadQueryFile(__dirname, "./transactions/delete-from-timestamp.sql"),
    },
    rounds: {
        deleteFromRound: utils_1.loadQueryFile(__dirname, "./rounds/delete-from-round.sql"),
        latest: utils_1.loadQueryFile(__dirname, "./rounds/latest.sql"),
        roundRange: utils_1.loadQueryFile(__dirname, "./rounds/round-range.sql"),
    },
    truncate: tables => `TRUNCATE TABLE ${tables} RESTART IDENTITY`,
};
//# sourceMappingURL=index.js.map