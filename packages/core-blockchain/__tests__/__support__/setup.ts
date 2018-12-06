import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/lib/helpers/container";

jest.setTimeout(60000);

export default {
  setUp: async () => {
    await appHelper.setUp({
      exit: "@arkecosystem/core-p2p",
      exclude: ["@arkecosystem/core-blockchain"],
    });

    return app;
  },

  tearDown: async () => {
    await app.tearDown();
  },
};
