import { app, Contracts } from "@arkecosystem/core-kernel";
import { copyFileSync, ensureFileSync, existsSync, readJSONSync, writeFileSync } from "fs-extra";

export const writeMetaFile = snapshotInfo =>
    writeFileSync(
        `${process.env.CORE_PATH_DATA}/snapshots/${snapshotInfo.folder}/meta.json`,
        JSON.stringify(snapshotInfo),
        "utf8",
    );

export const getFilePath = (filename, folder) => `${process.env.CORE_PATH_DATA}/snapshots/${folder}/${filename}`;

export const copySnapshot = (sourceFolder, destFolder) => {
    const logger = app.get<Contracts.Kernel.Log.Logger>("log");
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

    ensureFileSync(paths.dest.blocks);
    ensureFileSync(paths.dest.transactions);
    ensureFileSync(paths.dest.rounds);

    if (
        !existsSync(paths.source.blocks) ||
        !existsSync(paths.source.transactions) ||
        !existsSync(paths.source.rounds)
    ) {
        app.terminate(`Unable to copy snapshot from ${sourceFolder} as it doesn't exist`);
    }

    copyFileSync(paths.source.blocks, paths.dest.blocks);
    copyFileSync(paths.source.transactions, paths.dest.transactions);
    copyFileSync(paths.source.rounds, paths.dest.rounds);
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
        rounds: snapshotInfo.rounds,
        skipCompression: snapshotInfo.skipCompression,
    };
};

export const readMetaJSON = folder => {
    const metaFileInfo = this.getFilePath("meta.json", folder);

    if (!existsSync(metaFileInfo)) {
        app.terminate("Meta file meta.json not found. Exiting");
    }

    return readJSONSync(metaFileInfo);
};

export const setSnapshotInfo = (options, lastBlock) => {
    const meta = {
        startHeight: options.start !== -1 ? options.start : 1,
        endHeight: options.end !== -1 ? options.end : lastBlock.height,
        skipRoundRows: 0,
        skipCompression: options.skipCompression || false,
        folder: "",
    };

    meta.folder = `${meta.startHeight}-${meta.endHeight}`;

    if (options.blocks) {
        const oldMeta = this.getSnapshotInfo(options.blocks);
        meta.startHeight = oldMeta.endHeight + 1;
        meta.skipRoundRows = oldMeta.rounds.count;
        meta.folder = `${oldMeta.startHeight}-${meta.endHeight}`;
    }

    return meta;
};
