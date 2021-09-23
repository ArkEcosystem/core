"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.queries = {
    blocks: {
        common: utils_1.loadQueryFile(__dirname, "./blocks/common.sql"),
        count: utils_1.loadQueryFile(__dirname, "./blocks/count.sql"),
        delete: utils_1.loadQueryFile(__dirname, "./blocks/delete.sql"),
        findById: utils_1.loadQueryFile(__dirname, "./blocks/find-by-id.sql"),
        findByHeight: utils_1.loadQueryFile(__dirname, "./blocks/find-by-height.sql"),
        findByHeights: utils_1.loadQueryFile(__dirname, "./blocks/find-by-heights.sql"),
        headers: utils_1.loadQueryFile(__dirname, "./blocks/headers.sql"),
        heightRange: utils_1.loadQueryFile(__dirname, "./blocks/height-range.sql"),
        heightRangeWithTransactions: utils_1.loadQueryFile(__dirname, "./blocks/height-range-with-transactions.sql"),
        latest: utils_1.loadQueryFile(__dirname, "./blocks/latest.sql"),
        recent: utils_1.loadQueryFile(__dirname, "./blocks/recent.sql"),
        statistics: utils_1.loadQueryFile(__dirname, "./blocks/statistics.sql"),
        top: utils_1.loadQueryFile(__dirname, "./blocks/top.sql"),
    },
    common: {
        truncateAllTables: utils_1.loadQueryFile(__dirname, "./common/truncate-all-tables.sql"),
    },
    migrations: {
        create: utils_1.loadQueryFile(__dirname, "./migrations/create.sql"),
        find: utils_1.loadQueryFile(__dirname, "./migrations/find.sql"),
    },
    rounds: {
        delete: utils_1.loadQueryFile(__dirname, "./rounds/delete.sql"),
        find: utils_1.loadQueryFile(__dirname, "./rounds/find.sql"),
    },
    stateBuilder: {
        blockRewards: utils_1.loadQueryFile(__dirname, "./state-builder/block-rewards.sql"),
        delegatesForgedBlocks: utils_1.loadQueryFile(__dirname, "./state-builder/delegates-forged-blocks.sql"),
        lastForgedBlocks: utils_1.loadQueryFile(__dirname, "./state-builder/last-forged-blocks.sql"),
        receivedTransactions: utils_1.loadQueryFile(__dirname, "./state-builder/received-transactions.sql"),
        sentTransactions: utils_1.loadQueryFile(__dirname, "./state-builder/sent-transactions.sql"),
        countType: utils_1.loadQueryFile(__dirname, "./state-builder/count-type.sql"),
        assetsByType: utils_1.loadQueryFile(__dirname, "./state-builder/assets-by-type.sql"),
        openLocks: utils_1.loadQueryFile(__dirname, "./state-builder/open-locks.sql"),
        refundedLocks: utils_1.loadQueryFile(__dirname, "./state-builder/refunded-locks.sql"),
        claimedLocks: utils_1.loadQueryFile(__dirname, "./state-builder/claimed-locks.sql"),
    },
    transactions: {
        findByBlock: utils_1.loadQueryFile(__dirname, "./transactions/find-by-block.sql"),
        latestByBlock: utils_1.loadQueryFile(__dirname, "./transactions/latest-by-block.sql"),
        latestByBlocks: utils_1.loadQueryFile(__dirname, "./transactions/latest-by-blocks.sql"),
        statistics: utils_1.loadQueryFile(__dirname, "./transactions/statistics.sql"),
        forged: utils_1.loadQueryFile(__dirname, "./transactions/forged.sql"),
        findById: utils_1.loadQueryFile(__dirname, "./transactions/find-by-id.sql"),
        deleteByBlock: utils_1.loadQueryFile(__dirname, "./transactions/delete-by-block.sql"),
        feeStatistics: utils_1.loadQueryFile(__dirname, "./transactions/fee-statistics.sql"),
        findByHtlcLocks: utils_1.loadQueryFile(__dirname, "./transactions/find-by-htlc-locks.sql"),
    },
};
//# sourceMappingURL=index.js.map