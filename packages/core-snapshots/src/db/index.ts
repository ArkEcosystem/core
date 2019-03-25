import { app } from "@arkecosystem/core-container";
import { migrations, plugin, PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Logger } from "@arkecosystem/core-interfaces";

import { queries } from "./queries";
import { rawQuery } from "./utils";
import { columns } from "./utils/column-set";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

class Database {
    public db: any;
    public pgp: any;
    public blocksColumnSet: any;
    public transactionsColumnSet: any;

    public async make(connection: PostgresConnection) {
        this.db = connection.db;
        this.pgp = (connection as any).pgp;
        this.__createColumnSets();
        return this;
    }

    public async getLastBlock() {
        return this.db.oneOrNone(queries.blocks.latest);
    }

    public async getBlockByHeight(height) {
        return this.db.oneOrNone(queries.blocks.findByHeight, { height });
    }

    public async truncateChain() {
        const tables = ["rounds", "transactions", "blocks"];
        logger.info("Truncating tables: rounds, transactions, blocks");
        try {
            for (const table of tables) {
                await this.db.none(queries.truncate(table));
            }

            return this.getLastBlock();
        } catch (error) {
            app.forceExit("Truncate chain error", error);
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

    public close() {
        if (!app.has("blockchain")) {
            logger.debug("Closing snapshots-cli database connection");
            this.db.$pool.end();
            this.pgp.end();
        }
    }

    public __createColumnSets() {
        this.blocksColumnSet = new this.pgp.helpers.ColumnSet(columns.blocks, {
            table: "blocks",
        });
        this.transactionsColumnSet = new this.pgp.helpers.ColumnSet(columns.transactions, { table: "transactions" });
    }
}

export const database = new Database();
