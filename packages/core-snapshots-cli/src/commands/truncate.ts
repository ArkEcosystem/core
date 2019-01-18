import { app } from "@arkecosystem/core-container";
import { SnapshotManager } from "@arkecosystem/core-snapshots";

export async function truncateSnapshot(options) {
    const snapshotManager = app.resolvePlugin<SnapshotManager>("snapshots");
    await snapshotManager.truncateChain();
}
