import { loadQueryFile } from "../utils";

export const queries = {
    blocks: {
        common: loadQueryFile(__dirname, "./blocks/common.sql"),
        count: loadQueryFile(__dirname, "./blocks/count.sql"),
        delete: loadQueryFile(__dirname, "./blocks/delete.sql"),
        findById: loadQueryFile(__dirname, "./blocks/find-by-id.sql"),
        findByHeight: loadQueryFile(__dirname, "./blocks/find-by-height.sql"),
        findByHeights: loadQueryFile(__dirname, "./blocks/find-by-heights.sql"),
        headers: loadQueryFile(__dirname, "./blocks/headers.sql"),
        heightRange: loadQueryFile(__dirname, "./blocks/height-range.sql"),
        latest: loadQueryFile(__dirname, "./blocks/latest.sql"),
        recent: loadQueryFile(__dirname, "./blocks/recent.sql"),
        statistics: loadQueryFile(__dirname, "./blocks/statistics.sql"),
        top: loadQueryFile(__dirname, "./blocks/top.sql"),
    },
    common: {
        truncateAllTables: loadQueryFile(__dirname, "./common/truncate-all-tables.sql"),
    },
    migrations: {
        create: loadQueryFile(__dirname, "./migrations/create.sql"),
        find: loadQueryFile(__dirname, "./migrations/find.sql"),
    },
    rounds: {
        delete: loadQueryFile(__dirname, "./rounds/delete.sql"),
        find: loadQueryFile(__dirname, "./rounds/find.sql"),
    },
    stateBuilder: {
        blockRewards: loadQueryFile(__dirname, "./state-builder/block-rewards.sql"),
        delegatesForgedBlocks: loadQueryFile(__dirname, "./state-builder/delegates-forged-blocks.sql"),
        lastForgedBlocks: loadQueryFile(__dirname, "./state-builder/last-forged-blocks.sql"),
        receivedTransactions: loadQueryFile(__dirname, "./state-builder/received-transactions.sql"),
        sentTransactions: loadQueryFile(__dirname, "./state-builder/sent-transactions.sql"),
        assetsByType: loadQueryFile(__dirname, "./state-builder/assets-by-type.sql"),
    },
    transactions: {
        findByBlock: loadQueryFile(__dirname, "./transactions/find-by-block.sql"),
        latestByBlock: loadQueryFile(__dirname, "./transactions/latest-by-block.sql"),
        latestByBlocks: loadQueryFile(__dirname, "./transactions/latest-by-blocks.sql"),
        statistics: loadQueryFile(__dirname, "./transactions/statistics.sql"),
        forged: loadQueryFile(__dirname, "./transactions/forged.sql"),
        findById: loadQueryFile(__dirname, "./transactions/find-by-id.sql"),
        deleteByBlock: loadQueryFile(__dirname, "./transactions/delete-by-block.sql"),
        feeStatistics: loadQueryFile(__dirname, "./transactions/fee-statistics.sql"),
    },
};
