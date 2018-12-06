import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/lib/helpers/container";

jest.setTimeout(60000);

export const setUp = async () => {
  await appHelper.setUp({
    exit: "@arkecosystem/core-blockchain",
  });
};

export const tearDown = async () => {
  await app.tearDown();
};
