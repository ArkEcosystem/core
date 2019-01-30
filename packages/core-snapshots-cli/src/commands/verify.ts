import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";
import fs from "fs-extra";

export async function verifySnapshot(options) {
    const snapshotManager = app.resolve<SnapshotManager>("snapshots");

    if (options.filename && !fs.existsSync(`${process.env.CORE_PATH_DATA}/snapshots/${options.filename}`)) {
        app.logger.error(`Verify not possible. Snapshot ${options.filename} not found.`);
        app.logger.info("Use -f parameter with just the filename and not the full path.");
    } else {
        await snapshotManager.verifyData(options);
    }
}
