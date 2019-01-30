/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-kernel";
import pick from "lodash/pick";

import { database } from "./db";
import * as utils from "./utils";

import { backupTransactionsToJSON, exportTable, importTable, verifyTable } from "./transport";

export class SnapshotManager {
    public database: any;
    constructor(readonly options) {}

    public async make(connection) {
        this.database = await database.make(connection);

        return this;
    }

    public async exportData(options) {
        const params = await this.__init(options, true);

        if (params.skipExportWhenNoChange) {
            app.logger.info(`Skipping export of snapshot, because ${params.meta.folder} is already up to date.`);
            return;
        }

        const metaInfo = {
            blocks: await exportTable("blocks", params),
            transactions: await exportTable("transactions", params),
            folder: params.meta.folder,
            codec: options.codec,
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
        app.logger.info(
            `Import from folder ${
                params.meta.folder
            } completed. Last block in database: ${lastBlock.height.toLocaleString()} :+1:`,
        );
        if (!params.skipRestartRound) {
            const newLastBlock = await this.database.rollbackChain(lastBlock.height);
            app.logger.info(
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

    public async rollbackChain(height) {
        const lastBlock = await this.database.getLastBlock();
        const config = app.getConfig();
        const maxDelegates = config.getMilestone(lastBlock.height).activeDelegates;

        const rollBackHeight = height === -1 ? lastBlock.height : height;
        if (rollBackHeight >= lastBlock.height || rollBackHeight < 1) {
            // app.terminate(
            //     `Specified rollback block height: ${rollBackHeight.toLocaleString()} is not valid. Current database height: ${lastBlock.height.toLocaleString()}. Exiting.`,
            // );
        }

        if (height) {
            const rollBackBlock = await this.database.getBlockByHeight(rollBackHeight);
            const qTransactionBackup = await this.database.getTransactionsBackupQuery(rollBackBlock.timestamp);
            await backupTransactionsToJSON(
                `rollbackTransactionBackup.${+height + 1}.${lastBlock.height}.json`,
                qTransactionBackup,
                this.database,
            );
        }

        const newLastBlock = await this.database.rollbackChain(rollBackHeight);
        app.logger.info(
            `Rolling back chain to last finished round ${(
                newLastBlock.height / maxDelegates
            ).toLocaleString()} with last block height ${newLastBlock.height.toLocaleString()}`,
        );

        this.database.close();
    }

    /**
     * Inits the process and creates json with needed paramaters for functions
     * @param  {JSONObject} from commander or util function {blocks, codec, truncate, signatureVerify, skipRestartRound, start, end}
     * @return {JSONObject} with merged parameters, adding {lastBlock, database, meta {startHeight, endHeight, folder}, queries {blocks, transactions}}
     */
    public async __init(options, exportAction = false) {
        const params: any = pick(options, [
            "truncate",
            "signatureVerify",
            "blocks",
            "codec",
            "skipRestartRound",
            "start",
            "end",
            "skipCompression",
        ]);

        const lastBlock = await this.database.getLastBlock();
        params.lastBlock = lastBlock;
        params.codec = params.codec || this.options.codec;
        params.chunkSize = this.options.chunkSize || 50000;

        if (exportAction) {
            if (!lastBlock) {
                // app.terminate("Database is empty. Export not possible.");
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
                utils.copySnapshot(options.blocks, params.meta.folder, params.codec);
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
