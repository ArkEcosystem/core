import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/lib/helpers/container";

jest.setTimeout(60000);

export async function setUp() {
  // @ts-ignore
  process.env.ARK_JSON_RPC_ENABLED = true;

  return appHelper.setUp({
    exclude: [
      "@arkecosystem/core-api",
      "@arkecosystem/core-webhooks",
      "@arkecosystem/core-graphql",
      "@arkecosystem/core-forger"
    ]
  });
}

export async function tearDown() {
  return app.tearDown();
}
