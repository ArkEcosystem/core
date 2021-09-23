"use strict";
/* tslint:disable:max-line-length */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const lodash_pick_1 = __importDefault(require("lodash.pick"));
const logger = core_container_1.app.resolvePlugin("logger");
const db_1 = require("./db");
const utils = __importStar(require("./utils"));
const transport_1 = require("./transport");
class SnapshotManager {
    constructor(options) {
        this.options = options;
    }
    async make(connection) {
        this.database = await db_1.database.make(connection);
        return this;
    }
    async dump(options) {
        const params = await this.init(options, true);
        if (params.skipExportWhenNoChange) {
            logger.info(`Skipping export of snapshot, because ${params.meta.folder} is already up to date.`);
            return;
        }
        const metaInfo = {
            blocks: await transport_1.exportTable("blocks", params),
            transactions: await transport_1.exportTable("transactions", params),
            rounds: await transport_1.exportTable("rounds", params),
            folder: params.meta.folder,
            skipCompression: params.meta.skipCompression,
        };
        this.database.close();
        utils.writeMetaFile(metaInfo);
    }
    async import(options) {
        const params = await this.init(options);
        if (params.truncate) {
            await this.database.truncate();
            params.lastBlock = undefined;
        }
        await transport_1.importTable("blocks", params);
        await transport_1.importTable("transactions", params);
        await transport_1.importTable("rounds", params);
        const lastBlock = await this.database.getLastBlock();
        const height = lastBlock.height;
        logger.info(`Import from folder ${params.meta.folder} completed. Last block in database: ${height.toLocaleString()}`);
        if (!params.skipRestartRound) {
            const roundInfo = core_utils_1.roundCalculator.calculateRound(height);
            const newLastBlock = await this.database.rollbackChain(roundInfo);
            logger.info(`Rolling back chain to last finished round with last block height ${newLastBlock.height.toLocaleString()}`);
        }
        this.database.close();
    }
    async verify(options) {
        const params = await this.init(options);
        await Promise.all([transport_1.verifyTable("blocks", params), transport_1.verifyTable("transactions", params)]);
    }
    async truncate() {
        await this.database.truncate();
        this.database.close();
    }
    async rollbackByHeight(height, backupTransactions = true) {
        if (!height || height <= 0) {
            core_container_1.app.forceExit(`Rollback height ${height.toLocaleString()} is invalid.`);
        }
        const currentHeight = (await this.database.getLastBlock()).height;
        const roundInfo = core_utils_1.roundCalculator.calculateRound(height);
        const { round } = roundInfo;
        if (height >= currentHeight) {
            core_container_1.app.forceExit(`Rollback height ${height.toLocaleString()} is greater than the current height ${currentHeight.toLocaleString()}.`);
        }
        const rollbackBlock = await this.database.getBlockByHeight(height);
        const queryTransactionBackup = await this.database.getTransactionsBackupQuery(rollbackBlock.timestamp);
        if (backupTransactions) {
            await transport_1.backupTransactionsToJSON(`rollbackTransactionBackup.${+height + 1}.${currentHeight}.json`, queryTransactionBackup, this.database);
        }
        const newLastBlock = await this.database.rollbackChain(roundInfo);
        logger.info(`Rolling back chain to last finished round ${round.toLocaleString()} with last block height ${newLastBlock.height.toLocaleString()}`);
        this.database.close();
    }
    async rollbackByNumber(amount, backupTransactions = true) {
        const { height } = await this.database.getLastBlock();
        return this.rollbackByHeight(height - amount, backupTransactions);
    }
    async init(options, exportAction = false) {
        const params = lodash_pick_1.default(options, [
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
                core_container_1.app.forceExit("Database is empty. Export not possible.");
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
        }
        else {
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
exports.SnapshotManager = SnapshotManager;
//# sourceMappingURL=manager.js.map