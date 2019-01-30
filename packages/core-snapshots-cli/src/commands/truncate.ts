import { app } from "@arkecosystem/core-kernel";
import { SnapshotManager } from "@arkecosystem/core-snapshots";

export async function truncateSnapshot(options) {
    const snapshotManager = app.resolve<SnapshotManager>("snapshots");
    await snapshotManager.truncateChain();
}
