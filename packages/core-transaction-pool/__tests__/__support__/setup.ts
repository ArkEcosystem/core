import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export default {
  setUp: async () => {
    await appHelper.setUp({
      exit: "@arkecosystem/core-blockchain",
      exclude: ["@arkecosystem/core-transaction-pool"]
    });

    return app;
  },
  tearDown: async () => {
    await app.tearDown();
  }
};
