import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";

export async function rollbackSnapshot(options) {
    const logger = app.resolvePlugin<Logger.ILogger>("logger");
    const snapshotManager = app.resolvePlugin("snapshots");

    if (options.blockHeight === -1) {
        logger.warn("Rollback height is not specified. Rolling back to last completed round.");
    }
    logger.info(
        `Starting the process of blockchain rollback to block height of ${options.blockHeight.toLocaleString()}`,
    );

    await snapshotManager.rollbackChain(options.blockHeight);
}
