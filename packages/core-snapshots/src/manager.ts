/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { Logger } from "@arkecosystem/core-interfaces";
import pick from "lodash.pick";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
import { database } from "./db";
import * as utils from "./utils";

import { backupTransactionsToJSON, exportTable, importTable, verifyTable } from "./transport";

export class SnapshotManager {
    public database: any;
    constructor(readonly options) {}

    public async make(connection: PostgresConnection) {
        this.database = await database.make(connection);

        return this;
    }

    public async exportData(options) {
        const params = await this.__init(options, true);

        if (params.skipExportWhenNoChange) {
            logger.info(`Skipping export of snapshot, because ${params.meta.folder} is already up to date.`);
            return;
        }

        const metaInfo = {
            blocks: await exportTable("blocks", params),
            transactions: await exportTable("transactions", params),
            folder: params.meta.folder,
            skipCompression: params.meta.skipCompression,
        };

        this.database.close();
        utils.writeMetaFile(metaInfo);
    }

    public async importData(options) {
        const params = await this.__init(options);

        if (params.truncate) {
            params.lastBlock = await this.database.truncateChain();
        }

        await importTable("blocks", params);
        await importTable("transactions", params);

        const lastBlock = await this.database.getLastBlock();
        logger.info(
            `Import from folder ${
                params.meta.folder
            } completed. Last block in database: ${lastBlock.height.toLocaleString()}`,
        );
        if (!params.skipRestartRound) {
            const newLastBlock = await this.database.rollbackChain(lastBlock.height);
            logger.info(
                `Rolling back chain to last finished round with last block height ${newLastBlock.height.toLocaleString()}`,
            );
        }

        this.database.close();
    }

    public async verifyData(options) {
        const params = await this.__init(options);

        await Promise.all([verifyTable("blocks", params), verifyTable("transactions", params)]);
    }

    public async truncateChain() {
        await this.database.truncateChain();

        this.database.close();
    }

    public async rollbackByHeight(height) {
        if (!height || height <= 0) {
            app.forceExit(`Rollback height ${height.toLocaleString()} is invalid.`);
        }

        const currentHeight = (await this.database.getLastBlock()).height;
        const { activeDelegates } = app.getConfig().getMilestone(currentHeight);

        if (height >= currentHeight) {
            app.forceExit(
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

        const newLastBlock = await this.database.rollbackChain(height);
        logger.info(
            `Rolling back chain to last finished round ${(
                newLastBlock.height / activeDelegates
            ).toLocaleString()} with last block height ${newLastBlock.height.toLocaleString()}`,
        );

        this.database.close();
    }

    public async rollbackByNumber(amount: number) {
        const { height } = await this.database.getLastBlock();

        return this.rollbackByHeight(height - amount);
    }

    /**
     * Inits the process and creates json with needed paramaters for functions
     * @param  {JSONObject} from commander or util function {blocks, truncate, signatureVerify, skipRestartRound, start, end}
     * @return {JSONObject} with merged parameters, adding {lastBlock, database, meta {startHeight, endHeight, folder}, queries {blocks, transactions}}
     */
    public async __init(options, exportAction = false) {
        const params: any = pick(options, [
            "truncate",
            "signatureVerify",
            "blocks",
            "skipRestartRound",
            "start",
            "end",
            "skipCompression",
        ]);

        const lastBlock = await this.database.getLastBlock();
        params.lastBlock = lastBlock;
        params.chunkSize = this.options.chunkSize || 50000;

        if (exportAction) {
            if (!lastBlock) {
                app.forceExit("Database is empty. Export not possible.");
            }
            params.meta = utils.setSnapshotInfo(params, lastBlock);
            params.queries = await this.database.getExportQueries(params.meta.startHeight, params.meta.endHeight);

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
            // tslint:disable-next-line:no-console
            console.info(params.meta);
            // tslint:disable-next-line:no-console
            console.info(params.queries);
        }
        params.database = this.database;
        return params;
    }
}
