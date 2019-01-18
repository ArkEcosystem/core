import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import fs from "fs-extra";

export async function verifySnapshot(options) {
    const logger = app.resolvePlugin<Logger.ILogger>("logger");
    const snapshotManager = app.resolvePlugin<SnapshotManager>("snapshots");

    if (
        options.filename &&
        !fs.existsSync(`${process.env.CORE_PATH_DATA}/snapshots/${process.env.CORE_NETWORK_NAME}/${options.filename}`)
    ) {
        logger.error(`Verify not possible. Snapshot ${options.filename} not found.`);
        logger.info("Use -f parameter with just the filename and not the full path.");
    } else {
        await snapshotManager.verifyData(options);
    }
}
