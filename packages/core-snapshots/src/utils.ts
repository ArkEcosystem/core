import { Contracts } from "@arkecosystem/core-kernel";
import { copyFileSync, ensureFileSync, existsSync, readJSONSync, writeFileSync } from "fs-extra";

export const writeMetaFile = snapshotInfo =>
    writeFileSync(
        `${process.env.CORE_PATH_DATA}/snapshots/${snapshotInfo.folder}/meta.json`,
        JSON.stringify(snapshotInfo),
        "utf8",
    );

export const getFilePath = (filename, folder) => `${process.env.CORE_PATH_DATA}/snapshots/${folder}/${filename}`;

export const copySnapshot = (app: Contracts.Kernel.Application, sourceFolder, destFolder) => {
    app.log.info(`Copying snapshot ${sourceFolder} to ${destFolder} for appending of data`);

    const paths = {
        source: {
            blocks: getFilePath("blocks", sourceFolder),
            transactions: getFilePath("transactions", sourceFolder),
            rounds: getFilePath("rounds", sourceFolder),
        },
        dest: {
            blocks: getFilePath("blocks", destFolder),
            transactions: getFilePath("transactions", destFolder),
            rounds: getFilePath("rounds", destFolder),
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

export const readMetaJSON = (app: Contracts.Kernel.Application, folder) => {
    const metaFileInfo = getFilePath("meta.json", folder);

    if (!existsSync(metaFileInfo)) {
        app.terminate("Meta file meta.json not found. Exiting");
    }

    return readJSONSync(metaFileInfo);
};

export const calcRecordCount = (app: Contracts.Kernel.Application, table, currentCount, sourceFolder) => {
    if (sourceFolder) {
        const snapshotInfo = readMetaJSON(app, sourceFolder);
        return +snapshotInfo[table].count + currentCount;
    }

    return currentCount;
};

export const calcStartHeight = (app: Contracts.Kernel.Application, table, currentHeight, sourceFolder) => {
    if (sourceFolder) {
        const snapshotInfo = readMetaJSON(app, sourceFolder);
        return +snapshotInfo[table].startHeight;
    }

    return currentHeight;
};

export const getSnapshotInfo = (app: Contracts.Kernel.Application, folder) => {
    const snapshotInfo = readMetaJSON(app, folder);
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

export const setSnapshotInfo = (app: Contracts.Kernel.Application, options, lastBlock) => {
    const meta = {
        startHeight: options.start !== -1 ? options.start : 1,
        endHeight: options.end !== -1 ? options.end : lastBlock.height,
        skipCompression: options.skipCompression || false,
        folder: "",
    };

    meta.folder = `${meta.startHeight}-${meta.endHeight}`;

    if (options.blocks) {
        const oldMeta = getSnapshotInfo(app, options.blocks);
        meta.startHeight = oldMeta.endHeight + 1;
        meta.folder = `${oldMeta.startHeight}-${meta.endHeight}`;
    }

    return meta;
};
