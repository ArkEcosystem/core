import { app } from "@arkecosystem/core-container";
import "@arkecosystem/core-test-utils"
import appHelper from "@arkecosystem/core-test-utils/src/helpers/container";

export default {
  setUp: async () => {
    jest.setTimeout(60000);

    process.env.ARK_SKIP_BLOCKCHAIN = "true";

    await appHelper.setUp({
      exit: "@arkecosystem/core-blockchain",
      exclude: [
        "@arkecosystem/core-p2p",
        "@arkecosystem/core-transaction-pool",
        "@arkecosystem/core-database-postgres",
      ],
    });
  },

  tearDown: async () => {
    await app.tearDown();
  }
}
