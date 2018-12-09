import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

async function setUp() {
  return setUpContainer({
    exit: "@arkecosystem/core-logger-winston",
  });
}

async function tearDown() {
  return app.tearDown();
}

export { setUp, tearDown };
