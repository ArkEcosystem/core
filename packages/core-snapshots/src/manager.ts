import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app, Utils } from "@arkecosystem/core-kernel";

const logger = app.log;
import { Database, database } from "./db";
import { backupTransactionsToJSON, exportTable, importTable, verifyTable } from "./transport";
import * as utils from "./utils";

export class SnapshotManager {
    public database: Database;
    constructor(readonly options) {}

    public async make(connection: PostgresConnection) {
        this.database = await database.make(connection);

        return this;
    }

    public async dump(options) {
        const params = await this.init(options, true);

        if (params.skipExportWhenNoChange) {
            logger.info(`Skipping export of snapshot, because ${params.meta.folder} is already up to date.`);
            return;
        }

        const metaInfo = {
            blocks: await exportTable("blocks", params),
            transactions: await exportTable("transactions", params),
            rounds: await exportTable("rounds", params),
            folder: params.meta.folder,
            skipCompression: params.meta.skipCompression,
        };

        this.database.close();

        utils.writeMetaFile(metaInfo);
    }

    public async import(options) {
        const params = await this.init(options);

        if (params.truncate) {
            await this.database.truncate();
            params.lastBlock = undefined;
        }

        await importTable("blocks", params);
        await importTable("transactions", params);
        await importTable("rounds", params);

        const lastBlock = await this.database.getLastBlock();
        const height = lastBlock.height as number;

        logger.info(
            `Import from folder ${params.meta.folder} completed. Last block in database: ${height.toLocaleString()}`,
        );

        if (!params.skipRestartRound) {
            const roundInfo = Utils.roundCalculator.calculateRound(height);
            const newLastBlock = await this.database.rollbackChain(roundInfo);
            logger.info(
                `Rolling back chain to last finished round with last block height ${newLastBlock.height.toLocaleString()}`,
            );
        }

        this.database.close();
    }

    public async verify(options) {
        const params = await this.init(options);

        await Promise.all([verifyTable("blocks", params), verifyTable("transactions", params)]);
    }

    public async truncate() {
        await this.database.truncate();

        this.database.close();
    }

    public async rollbackByHeight(height: number) {
        if (!height || height <= 0) {
            app.terminate(`Rollback height ${height.toLocaleString()} is invalid.`);
        }

        const currentHeight = (await this.database.getLastBlock()).height;
        const roundInfo = Utils.roundCalculator.calculateRound(height);
        const { round } = roundInfo;

        if (height >= currentHeight) {
            app.terminate(
                `Rollback height ${height.toLocaleString()} is greater than the current height ${currentHeight.toLocaleString()}.`,
            );
        }

        const rollbackBlock = await this.database.getBlockByHeight(height);
        const queryTransactionBackup = await this.database.getTransactionsBackupQuery(rollbackBlock.timestamp);

        await backupTransactionsToJSON(
            `rollbackTransactionBackup.${+height + 1}.${currentHeight}.json`,
            queryTransactionBackup,
            this.database,
        );

        const newLastBlock = await this.database.rollbackChain(roundInfo);
        logger.info(
            `Rolling back chain to last finished round ${round.toLocaleString()} with last block height ${newLastBlock.height.toLocaleString()}`,
        );

        this.database.close();
    }

    public async rollbackByNumber(amount: number) {
        const { height } = await this.database.getLastBlock();

        return this.rollbackByHeight(height - amount);
    }

    private async init(options, exportAction = false) {
        const params: any = Utils.pick(options, [
            "truncate",
            "blocks",
            "verifySignatures",
            "skipRestartRound",
            "start",
            "end",
            "skipCompression",
        ]);

        const lastBlock = await this.database.getLastBlock();
        params.lastBlock = lastBlock;
        params.lastRound = await this.database.getLastRound();
        params.chunkSize = this.options.chunkSize || 50000;

        if (exportAction) {
            if (!lastBlock) {
                app.terminate("Database is empty. Export not possible.");
            }

            params.meta = utils.setSnapshotInfo(params, lastBlock);
            params.queries = await this.database.getExportQueries(params.meta);

            if (params.blocks) {
                if (options.blocks === params.meta.folder) {
                    params.skipExportWhenNoChange = true;
                    return params;
                }

                const sourceSnapshotParams = utils.readMetaJSON(params.blocks);
                params.meta.skipCompression = sourceSnapshotParams.skipCompression;
                params.meta.startHeight = sourceSnapshotParams.blocks.startHeight;
                utils.copySnapshot(options.blocks, params.meta.folder);
            }
        } else {
            params.meta = utils.getSnapshotInfo(options.blocks);
        }

        if (options.trace) {
            logger.info(params.meta);
            logger.info(params.queries);
        }

        params.database = this.database;

        return params;
    }
}
