export declare const queries: {
    blocks: {
        common: import("pg-promise").QueryFile;
        count: import("pg-promise").QueryFile;
        delete: import("pg-promise").QueryFile;
        findById: import("pg-promise").QueryFile;
        findByHeight: import("pg-promise").QueryFile;
        findByHeights: import("pg-promise").QueryFile;
        headers: import("pg-promise").QueryFile;
        heightRange: import("pg-promise").QueryFile;
        heightRangeWithTransactions: import("pg-promise").QueryFile;
        latest: import("pg-promise").QueryFile;
        recent: import("pg-promise").QueryFile;
        statistics: import("pg-promise").QueryFile;
        top: import("pg-promise").QueryFile;
    };
    common: {
        truncateAllTables: import("pg-promise").QueryFile;
    };
    migrations: {
        create: import("pg-promise").QueryFile;
        find: import("pg-promise").QueryFile;
    };
    rounds: {
        delete: import("pg-promise").QueryFile;
        find: import("pg-promise").QueryFile;
    };
    stateBuilder: {
        blockRewards: import("pg-promise").QueryFile;
        delegatesForgedBlocks: import("pg-promise").QueryFile;
        lastForgedBlocks: import("pg-promise").QueryFile;
        receivedTransactions: import("pg-promise").QueryFile;
        sentTransactions: import("pg-promise").QueryFile;
        countType: import("pg-promise").QueryFile;
        assetsByType: import("pg-promise").QueryFile;
        openLocks: import("pg-promise").QueryFile;
        refundedLocks: import("pg-promise").QueryFile;
        claimedLocks: import("pg-promise").QueryFile;
    };
    transactions: {
        findByBlock: import("pg-promise").QueryFile;
        latestByBlock: import("pg-promise").QueryFile;
        latestByBlocks: import("pg-promise").QueryFile;
        statistics: import("pg-promise").QueryFile;
        forged: import("pg-promise").QueryFile;
        findById: import("pg-promise").QueryFile;
        deleteByBlock: import("pg-promise").QueryFile;
        feeStatistics: import("pg-promise").QueryFile;
        findByHtlcLocks: import("pg-promise").QueryFile;
    };
};
