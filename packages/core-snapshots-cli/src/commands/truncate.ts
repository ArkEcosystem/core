import { app } from "@arkecosystem/core-container";

export async function truncateSnapshot(options) {
    const snapshotManager = app.resolvePlugin("snapshots");
    await snapshotManager.truncateChain();
}
