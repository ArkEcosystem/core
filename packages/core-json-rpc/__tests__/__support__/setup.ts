import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export async function setUp() {
    // @ts-ignore
    process.env.ARK_JSON_RPC_ENABLED = true;

    return setUpContainer({
        exclude: ["@arkecosystem/core-webhooks", "@arkecosystem/core-graphql", "@arkecosystem/core-forger"],
    });
}

export async function tearDown() {
    return app.tearDown();
}
