import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/lib/helpers/container";

jest.setTimeout(60000);

export const setUp = async () => {
  process.env.ARK_GRAPHQL_ENABLED = "true";

  await appHelper.setUp({
    exclude: ["@arkecosystem/core-api", "@arkecosystem/core-forger"],
  });

  return app;
};

export const tearDown = async () => {
  await app.tearDown();
};
