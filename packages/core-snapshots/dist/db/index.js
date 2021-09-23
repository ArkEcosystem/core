"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const queries_1 = require("./queries");
const utils_1 = require("./utils");
const logger = core_container_1.app.resolvePlugin("logger");
class Database {
    async make(connection) {
        this.db = connection.db;
        this.pgp = connection.pgp;
        this.createColumnSets();
        return this;
    }
    close() {
        if (!core_container_1.app.has("blockchain")) {
            this.db.$pool.end();
            this.pgp.end();
        }
    }
    async getLastBlock() {
        return this.db.oneOrNone(queries_1.queries.blocks.latest);
    }
    /**
     * Get the highest row from the rounds table.
     * @return Object latest row
     * @return null if the table is empty.
     */
    async getLastRound() {
        return this.db.oneOrNone(queries_1.queries.rounds.latest);
    }
    async getBlockByHeight(height) {
        return this.db.oneOrNone(queries_1.queries.blocks.findByHeight, { height });
    }
    async truncate() {
        try {
            const tables = "rounds, transactions, blocks";
            logger.info(`Truncating tables: ${tables}`);
            await this.db.none(queries_1.queries.truncate(tables));
        }
        catch (error) {
            core_container_1.app.forceExit(error.message);
        }
    }
    async rollbackChain(roundInfo) {
        const { round, roundHeight } = roundInfo;
        const lastRemainingBlock = await this.getBlockByHeight(roundHeight);
        try {
            if (lastRemainingBlock) {
                await Promise.all([
                    this.db.none(queries_1.queries.transactions.deleteFromTimestamp, {
                        timestamp: lastRemainingBlock.timestamp,
                    }),
                    this.db.none(queries_1.queries.blocks.deleteFromHeight, {
                        height: lastRemainingBlock.height,
                    }),
                    this.db.none(queries_1.queries.rounds.deleteFromRound, { round }),
                ]);
            }
        }
        catch (error) {
            logger.error(error);
        }
        return this.getLastBlock();
    }
    async getExportQueries(meta) {
        const startBlock = await this.getBlockByHeight(meta.startHeight);
        const endBlock = await this.getBlockByHeight(meta.endHeight);
        if (!startBlock || !endBlock) {
            core_container_1.app.forceExit("Wrong input height parameters for building export queries. Blocks at height not found in db.");
        }
        let startRound;
        if (meta.startHeight <= 1) {
            startRound = 1;
        }
        else {
            const roundInfoPrev = core_utils_1.roundCalculator.calculateRound(meta.startHeight - 1);
            const roundInfoStart = core_utils_1.roundCalculator.calculateRound(meta.startHeight);
            if (roundInfoPrev.round === roundInfoStart.round) {
                // The lower snapshot contains this round, so skip it from this snapshot.
                // For example: a snapshot of blocks 1-80 contains full rounds 1 and 2, so
                // when we create a snapshot 81-... we must skip round 2 and start from 3.
                startRound = roundInfoStart.round + 1;
            }
            else {
                startRound = roundInfoStart.round;
            }
        }
        const roundInfoEnd = core_utils_1.roundCalculator.calculateRound(meta.endHeight);
        return {
            blocks: utils_1.rawQuery(this.pgp, queries_1.queries.blocks.heightRange, {
                start: startBlock.height,
                end: endBlock.height,
            }),
            transactions: utils_1.rawQuery(this.pgp, queries_1.queries.transactions.timestampRange, {
                start: startBlock.timestamp,
                end: endBlock.timestamp,
            }),
            rounds: utils_1.rawQuery(this.pgp, queries_1.queries.rounds.roundRange, {
                startRound,
                endRound: roundInfoEnd.round,
            }),
        };
    }
    getTransactionsBackupQuery(startTimestamp) {
        return utils_1.rawQuery(this.pgp, queries_1.queries.transactions.timestampHigher, {
            start: startTimestamp,
        });
    }
    getColumnSet(tableName) {
        switch (tableName) {
            case "blocks":
                return this.blocksColumnSet;
            case "transactions":
                return this.transactionsColumnSet;
            case "rounds":
                return this.roundsColumnSet;
            default:
                throw new Error("Invalid table name");
        }
    }
    createColumnSets() {
        this.blocksColumnSet = new this.pgp.helpers.ColumnSet([
            "id",
            "version",
            "timestamp",
            "previous_block",
            "height",
            "number_of_transactions",
            "total_amount",
            "total_fee",
            "reward",
            "payload_length",
            "payload_hash",
            "generator_public_key",
            "block_signature",
        ], {
            table: "blocks",
        });
        this.transactionsColumnSet = new this.pgp.helpers.ColumnSet([
            "id",
            "version",
            "nonce",
            "block_id",
            "sequence",
            "timestamp",
            "sender_public_key",
            "recipient_id",
            "type",
            "type_group",
            "vendor_field",
            "amount",
            "fee",
            "serialized",
            "asset",
        ], { table: "transactions" });
        this.roundsColumnSet = new this.pgp.helpers.ColumnSet(["round", "balance", "public_key"], { table: "rounds" });
    }
}
exports.Database = Database;
exports.database = new Database();
//# sourceMappingURL=index.js.map