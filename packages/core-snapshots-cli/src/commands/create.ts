import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import fs from "fs-extra";

export async function createSnapshot(options) {
    const snapshotManager = app.resolve<SnapshotManager>("snapshots");

    if (fs.existsSync(options.filename)) {
        app.logger.error(`Appending not possible. Existing snapshot ${options.filename} not found. Exiting...`);

        throw new Error(`Appending not possible. Existing snapshot ${options.filename} not found. Exiting...`);
    }

    await snapshotManager.exportData(options);
}
