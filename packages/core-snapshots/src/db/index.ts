import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app, Contracts } from "@arkecosystem/core-kernel";

import { roundCalculator } from "@arkecosystem/core-utils";
import { queries } from "./queries";
import { rawQuery } from "./utils";

const logger = app.ioc.get<Contracts.Kernel.Log.ILogger>("log");

export class Database {
    public db: any;
    public pgp: any;
    public blocksColumnSet: any;
    public transactionsColumnSet: any;
    public roundsColumnSet: any;

    public async make(connection: PostgresConnection) {
        this.db = connection.db;
        this.pgp = (connection as any).pgp;
        this.createColumnSets();

        return this;
    }

    public close() {
        if (!app.ioc.isBound("blockchain")) {
            this.db.$pool.end();
            this.pgp.end();
        }
    }

    public async getLastBlock() {
        return this.db.oneOrNone(queries.blocks.latest);
    }

    /**
     * Get the highest row from the rounds table.
     * @return Object latest row
     * @return null if the table is empty.
     */
    public async getLastRound(): Promise<{ public_key: string; balance: string; round: string } | null> {
        return this.db.oneOrNone(queries.rounds.latest);
    }

    public async getBlockByHeight(height) {
        return this.db.oneOrNone(queries.blocks.findByHeight, { height });
    }

    public async truncate() {
        try {
            const tables = "rounds, transactions, blocks";

            logger.info(`Truncating tables: ${tables}`);

            await this.db.none(queries.truncate(tables));
        } catch (error) {
            app.terminate(error.message);
        }
    }

    public async rollbackChain(roundInfo: Contracts.Shared.IRoundInfo) {
        const { round, roundHeight } = roundInfo;
        const lastRemainingBlock = await this.getBlockByHeight(roundHeight);

        try {
            if (lastRemainingBlock) {
                await Promise.all([
                    this.db.none(queries.transactions.deleteFromTimestamp, {
                        timestamp: lastRemainingBlock.timestamp,
                    }),
                    this.db.none(queries.blocks.deleteFromHeight, {
                        height: lastRemainingBlock.height,
                    }),
                    this.db.none(queries.rounds.deleteFromRound, { round }),
                ]);
            }
        } catch (error) {
            logger.error(error);
        }

        return this.getLastBlock();
    }

    public async getExportQueries(meta: {
        startHeight: number;
        endHeight: number;
        skipRoundRows: number;
        skipCompression: boolean;
        folder: string;
    }) {
        const startBlock = await this.getBlockByHeight(meta.startHeight);
        const endBlock = await this.getBlockByHeight(meta.endHeight);

        if (!startBlock || !endBlock) {
            app.terminate(
                "Wrong input height parameters for building export queries. Blocks at height not found in db.",
            );
        }

        const roundInfoStart: Contracts.Shared.IRoundInfo = roundCalculator.calculateRound(meta.startHeight);
        const roundInfoEnd: Contracts.Shared.IRoundInfo = roundCalculator.calculateRound(meta.endHeight);

        return {
            blocks: rawQuery(this.pgp, queries.blocks.heightRange, {
                start: startBlock.height,
                end: endBlock.height,
            }),
            transactions: rawQuery(this.pgp, queries.transactions.timestampRange, {
                start: startBlock.timestamp,
                end: endBlock.timestamp,
            }),
            rounds: rawQuery(this.pgp, queries.rounds.roundRange, {
                startRound: roundInfoStart.round,
                endRound: roundInfoEnd.round,
                skipRoundRows: meta.skipRoundRows,
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
            case "rounds":
                return this.roundsColumnSet;
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

        this.roundsColumnSet = new this.pgp.helpers.ColumnSet(["round", "balance", "public_key"], { table: "rounds" });
    }
}

export const database = new Database();
