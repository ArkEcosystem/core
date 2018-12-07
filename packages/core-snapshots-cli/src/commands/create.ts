import { app } from "@arkecosystem/core-container";
import fs from "fs-extra";

const logger = app.resolvePlugin("logger");
const snapshotManager = app.resolvePlugin("snapshots");

export default async (options) => {
  if (options.filename && !fs.existsSync(/*utils.getPath */ options.filename)) {
    logger.error(
      `Appending not possible. Existing snapshot ${
      options.filename
      } not found. Exiting...`,
    );
    throw new Error(
      `Appending not possible. Existing snapshot ${
      options.filename
      } not found. Exiting...`,
    );
  } else {
    await snapshotManager.exportData(options);
  }
};
