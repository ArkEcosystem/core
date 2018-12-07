import { app } from "@arkecosystem/core-container";
import { helpers } from "@arkecosystem/core-test-utils";

jest.setTimeout(60000);

export default {
  setUp: async () => {
    await helpers.setUpContainer({
      exit: "@arkecosystem/core-blockchain",
      exclude: ["@arkecosystem/core-transaction-pool"]
    });

    return app;
  },
  tearDown: async () => {
    await app.tearDown();
  }
};
