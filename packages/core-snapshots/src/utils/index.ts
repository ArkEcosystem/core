import { app } from "@arkecosystem/core-kernel";
import fs from "fs-extra";

export const getPath = (table, folder, codec) => {
    const filename = `${table}.${codec}`;
    return this.getFilePath(filename, folder);
};

export const writeMetaFile = snapshotInfo => {
    const path = `${process.env.CORE_PATH_DATA}/snapshots/${snapshotInfo.folder}/meta.json`;
    fs.writeFileSync(path, JSON.stringify(snapshotInfo), "utf8");
};

export const getFilePath = (filename, folder) => `${process.env.CORE_PATH_DATA}/snapshots/${folder}/${filename}`;

export const copySnapshot = (sourceFolder, destFolder, codec) => {
    app.logger.info(`Copying snapshot from ${sourceFolder} to a new file ${destFolder} for appending of data`);

    const paths = {
        source: {
            blocks: this.getPath("blocks", sourceFolder, codec),
            transactions: this.getPath("transactions", sourceFolder, codec),
        },
        dest: {
            blocks: this.getPath("blocks", destFolder, codec),
            transactions: this.getPath("transactions", destFolder, codec),
        },
    };

    fs.ensureFileSync(paths.dest.blocks);
    fs.ensureFileSync(paths.dest.transactions);

    if (!fs.existsSync(paths.source.blocks) || !fs.existsSync(paths.source.transactions)) {
        // app.terminate(`Unable to copy snapshot from ${sourceFolder} as it doesn't exist :bomb:`);
    }

    fs.copyFileSync(paths.source.blocks, paths.dest.blocks);
    fs.copyFileSync(paths.source.transactions, paths.dest.transactions);
};

export const calcRecordCount = (table, currentCount, sourceFolder) => {
    if (sourceFolder) {
        const snapshotInfo = this.readMetaJSON(sourceFolder);
        return +snapshotInfo[table].count + currentCount;
    }

    return currentCount;
};

export const calcStartHeight = (table, currentHeight, sourceFolder) => {
    if (sourceFolder) {
        const snapshotInfo = this.readMetaJSON(sourceFolder);
        return +snapshotInfo[table].startHeight;
    }

    return currentHeight;
};

export const getSnapshotInfo = folder => {
    const snapshotInfo = this.readMetaJSON(folder);
    return {
        startHeight: +snapshotInfo.blocks.startHeight,
        endHeight: +snapshotInfo.blocks.endHeight,
        folder: snapshotInfo.folder,
        blocks: snapshotInfo.blocks,
        transactions: snapshotInfo.transactions,
        skipCompression: snapshotInfo.skipCompression,
    };
};

export const readMetaJSON = folder => {
    const metaFileInfo = this.getFilePath("meta.json", folder);
    if (!fs.existsSync(metaFileInfo)) {
        // app.terminate("Meta file meta.json not found. Exiting :bomb:");
    }

    return fs.readJSONSync(metaFileInfo);
};

export const setSnapshotInfo = (options, lastBlock) => {
    const meta = {
        startHeight: options.start !== -1 ? options.start : 1,
        endHeight: options.end !== -1 ? options.end : lastBlock.height,
        codec: options.codec,
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
