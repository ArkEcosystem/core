import { app } from "@arkecosystem/core-container";
import { helpers } from "@arkecosystem/core-test-utils";

async function setUp() {
  return helpers.setUpContainer({
    exit: "@arkecosystem/core-logger-winston"
  });
}

async function tearDown() {
  return app.tearDown();
}

export { setUp, tearDown };
