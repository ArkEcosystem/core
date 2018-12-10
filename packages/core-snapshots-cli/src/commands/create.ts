import { app } from "@arkecosystem/core-container";
import fs from "fs-extra";

export async function createSnapshot(options) {
    const logger = app.resolvePlugin("logger");
    const snapshotManager = app.resolvePlugin("snapshots");

    if (options.filename && !fs.existsSync(/*utils.getPath */ options.filename)) {
        logger.error(`Appending not possible. Existing snapshot ${options.filename} not found. Exiting...`);
        throw new Error(`Appending not possible. Existing snapshot ${options.filename} not found. Exiting...`);
    } else {
        await snapshotManager.exportData(options);
    }
}
