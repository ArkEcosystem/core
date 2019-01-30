import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";

export async function rollbackSnapshot(options) {
    const snapshotManager = app.resolve<SnapshotManager>("snapshots");

    if (options.blockHeight === -1) {
        app.logger.warn("Rollback height is not specified. Rolling back to last completed round.");
    }

    app.logger.info(
        `Starting the process of blockchain rollback to block height of ${options.blockHeight.toLocaleString()}`,
    );

    await snapshotManager.rollbackChain(options.blockHeight);
}
