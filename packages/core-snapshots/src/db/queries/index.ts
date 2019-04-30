import { loadQueryFile } from "../utils";

export const queries = {
    blocks: {
        heightRange: loadQueryFile(__dirname, "./blocks/height-range.sql"),
        latest: loadQueryFile(__dirname, "./blocks/latest.sql"),
        findByHeight: loadQueryFile(__dirname, "./blocks/find-by-height.sql"),
        deleteFromHeight: loadQueryFile(__dirname, "./blocks/delete-from-height.sql"),
    },
    transactions: {
        timestampRange: loadQueryFile(__dirname, "./transactions/timestamp-range.sql"),
        timestampHigher: loadQueryFile(__dirname, "./transactions/timestamp-higher.sql"),
        deleteFromTimestamp: loadQueryFile(__dirname, "./transactions/delete-from-timestamp.sql"),
    },
    rounds: {
        deleteFromRound: loadQueryFile(__dirname, "./rounds/delete-from-round.sql"),
        roundRange: loadQueryFile(__dirname, "./rounds/round-range.sql"),
    },
    truncate: table => `TRUNCATE TABLE ${table} RESTART IDENTITY`,
};
