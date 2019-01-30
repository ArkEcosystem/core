import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";

export async function truncateSnapshot(options) {
    const snapshotManager = app.resolvePlugin<SnapshotManager>("snapshots");
    await snapshotManager.truncateChain();
}
