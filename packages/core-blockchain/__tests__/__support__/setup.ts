import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export default {
  setUp: async () => {
    await appHelper.setup({
      exit: "@arkecosystem/core-p2p",
      exclude: ["@arkecosystem/core-blockchain"],
    });

    return app;
  },

  tearDown: async () => {
    await app.tearDown();
  },
};
