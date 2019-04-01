import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Logger } from "@arkecosystem/core-interfaces";

import { queries } from "./queries";
import { rawQuery } from "./utils";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

class Database {
    public db: any;
    public pgp: any;
    public blocksColumnSet: any;
    public transactionsColumnSet: any;

    public async make(connection: PostgresConnection) {
        this.db = connection.db;
        this.pgp = (connection as any).pgp;
        this.createColumnSets();

        return this;
    }

    public close() {
        if (!app.has("blockchain")) {
            this.db.$pool.end();
            this.pgp.end();
        }
    }

    public async getLastBlock() {
        return this.db.oneOrNone(queries.blocks.latest);
    }

    public async getBlockByHeight(height) {
        return this.db.oneOrNone(queries.blocks.findByHeight, { height });
    }

    public async truncate() {
        try {
            logger.info("Truncating tables: rounds, transactions, blocks");

            for (const table of ["rounds", "transactions", "blocks"]) {
                await this.db.none(queries.truncate(table));
            }
        } catch (error) {
            app.forceExit(error.message);
        }
    }

    public async rollbackChain(height) {
        const config = app.getConfig();
        const maxDelegates = config.getMilestone(height).activeDelegates;
        const currentRound = Math.floor(height / maxDelegates);
        const lastBlockHeight = currentRound * maxDelegates;
        const lastRemainingBlock = await this.getBlockByHeight(lastBlockHeight);

        try {
            if (lastRemainingBlock) {
                await Promise.all([
                    this.db.none(queries.transactions.deleteFromTimestamp, {
                        timestamp: lastRemainingBlock.timestamp,
                    }),
                    this.db.none(queries.blocks.deleteFromHeight, {
                        height: lastRemainingBlock.height,
                    }),
                    this.db.none(queries.rounds.deleteFromRound, { round: currentRound }),
                ]);
            }
        } catch (error) {
            logger.error(error);
        }

        return this.getLastBlock();
    }

    public async getExportQueries(startHeight, endHeight) {
        const startBlock = await this.getBlockByHeight(startHeight);
        const endBlock = await this.getBlockByHeight(endHeight);

        if (!startBlock || !endBlock) {
            app.forceExit(
                "Wrong input height parameters for building export queries. Blocks at height not found in db.",
            );
        }

        return {
            blocks: rawQuery(this.pgp, queries.blocks.heightRange, {
                start: startBlock.height,
                end: endBlock.height,
            }),
            transactions: rawQuery(this.pgp, queries.transactions.timestampRange, {
                start: startBlock.timestamp,
                end: endBlock.timestamp,
            }),
        };
    }

    public getTransactionsBackupQuery(startTimestamp) {
        return rawQuery(this.pgp, queries.transactions.timestampHigher, {
            start: startTimestamp,
        });
    }

    public getColumnSet(tableName) {
        switch (tableName) {
            case "blocks":
                return this.blocksColumnSet;
            case "transactions":
                return this.transactionsColumnSet;
            default:
                throw new Error("Invalid table name");
        }
    }

    private createColumnSets() {
        this.blocksColumnSet = new this.pgp.helpers.ColumnSet(
            [
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
            ],
            {
                table: "blocks",
            },
        );

        this.transactionsColumnSet = new this.pgp.helpers.ColumnSet(
            [
                "id",
                "version",
                "block_id",
                "sequence",
                "timestamp",
                "sender_public_key",
                "recipient_id",
                "type",
                "vendor_field_hex",
                "amount",
                "fee",
                "serialized",
                "asset",
            ],
            { table: "transactions" },
        );
    }
}

export const database = new Database();
