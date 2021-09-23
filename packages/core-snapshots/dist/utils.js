"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const fs_extra_1 = require("fs-extra");
exports.writeMetaFile = snapshotInfo => fs_extra_1.writeFileSync(`${process.env.CORE_PATH_DATA}/snapshots/${snapshotInfo.folder}/meta.json`, JSON.stringify(snapshotInfo), "utf8");
exports.getFilePath = (filename, folder) => `${process.env.CORE_PATH_DATA}/snapshots/${folder}/${filename}`;
exports.copySnapshot = (sourceFolder, destFolder) => {
    const logger = core_container_1.app.resolvePlugin("logger");
    logger.info(`Copying snapshot ${sourceFolder} to ${destFolder} for appending of data`);
    const paths = {
        source: {
            blocks: this.getFilePath("blocks", sourceFolder),
            transactions: this.getFilePath("transactions", sourceFolder),
            rounds: this.getFilePath("rounds", sourceFolder),
        },
        dest: {
            blocks: this.getFilePath("blocks", destFolder),
            transactions: this.getFilePath("transactions", destFolder),
            rounds: this.getFilePath("rounds", destFolder),
        },
    };
    fs_extra_1.ensureFileSync(paths.dest.blocks);
    fs_extra_1.ensureFileSync(paths.dest.transactions);
    fs_extra_1.ensureFileSync(paths.dest.rounds);
    if (!fs_extra_1.existsSync(paths.source.blocks) ||
        !fs_extra_1.existsSync(paths.source.transactions) ||
        !fs_extra_1.existsSync(paths.source.rounds)) {
        core_container_1.app.forceExit(`Unable to copy snapshot from ${sourceFolder} as it doesn't exist`);
    }
    fs_extra_1.copyFileSync(paths.source.blocks, paths.dest.blocks);
    fs_extra_1.copyFileSync(paths.source.transactions, paths.dest.transactions);
    fs_extra_1.copyFileSync(paths.source.rounds, paths.dest.rounds);
};
exports.calcRecordCount = (table, currentCount, sourceFolder) => {
    if (sourceFolder) {
        const snapshotInfo = this.readMetaJSON(sourceFolder);
        return +snapshotInfo[table].count + currentCount;
    }
    return currentCount;
};
exports.calcStartHeight = (table, currentHeight, sourceFolder) => {
    if (sourceFolder) {
        const snapshotInfo = this.readMetaJSON(sourceFolder);
        return +snapshotInfo[table].startHeight;
    }
    return currentHeight;
};
exports.getSnapshotInfo = folder => {
    const snapshotInfo = this.readMetaJSON(folder);
    return {
        startHeight: +snapshotInfo.blocks.startHeight,
        endHeight: +snapshotInfo.blocks.endHeight,
        folder: snapshotInfo.folder,
        blocks: snapshotInfo.blocks,
        transactions: snapshotInfo.transactions,
        rounds: snapshotInfo.rounds,
        skipCompression: snapshotInfo.skipCompression,
    };
};
exports.readMetaJSON = folder => {
    const metaFileInfo = this.getFilePath("meta.json", folder);
    if (!fs_extra_1.existsSync(metaFileInfo)) {
        core_container_1.app.forceExit("Meta file meta.json not found. Exiting");
    }
    return fs_extra_1.readJSONSync(metaFileInfo);
};
exports.setSnapshotInfo = (options, lastBlock) => {
    const meta = {
        startHeight: options.start !== -1 ? options.start : 1,
        endHeight: options.end !== -1 ? options.end : lastBlock.height,
        skipCompression: options.skipCompression || false,
        folder: "",
    };
    meta.folder = `${meta.startHeight}-${meta.endHeight}`;
    if (options.blocks) {
        const oldMeta = this.getSnapshotInfo(options.blocks);
        meta.startHeight = oldMeta.endHeight + 1;
        meta.folder = `${oldMeta.startHeight}-${meta.endHeight}`;
    }
    return meta;
};
//# sourceMappingURL=utils.js.map