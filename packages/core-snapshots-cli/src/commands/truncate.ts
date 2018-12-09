import { app } from "@arkecosystem/core-container";

const snapshotManager = app.resolvePlugin("snapshots");

export async function truncateSnapshot(options) {
  await snapshotManager.truncateChain();
}
