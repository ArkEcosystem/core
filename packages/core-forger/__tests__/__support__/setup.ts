import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/src/helpers/container";

async function setUp() {
  return appHelper.setUp({
    exit: "@arkecosystem/core-logger-winston"
  });
}

async function tearDown() {
  return app.tearDown();
}

export { setUp, tearDown };
