export declare const queries: {
    blocks: {
        heightRange: import("pg-promise").QueryFile;
        latest: import("pg-promise").QueryFile;
        findByHeight: import("pg-promise").QueryFile;
        deleteFromHeight: import("pg-promise").QueryFile;
    };
    transactions: {
        timestampRange: import("pg-promise").QueryFile;
        timestampHigher: import("pg-promise").QueryFile;
        deleteFromTimestamp: import("pg-promise").QueryFile;
    };
    rounds: {
        deleteFromRound: import("pg-promise").QueryFile;
        latest: import("pg-promise").QueryFile;
        roundRange: import("pg-promise").QueryFile;
    };
    truncate: (tables: any) => string;
};
