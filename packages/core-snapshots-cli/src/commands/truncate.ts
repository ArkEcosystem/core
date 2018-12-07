import { app } from "@arkecosystem/core-container";

const snapshotManager = app.resolvePlugin("snapshots");

export default async (options) => {
  await snapshotManager.truncateChain();
};
