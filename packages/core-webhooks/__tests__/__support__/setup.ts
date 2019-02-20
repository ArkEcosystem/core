import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";
import { tmpdir } from "os";
import { webhookManager } from "../../src/manager";
import { startServer } from "../../src/server";

jest.setTimeout(60000);

export async function setUp() {
    process.env.CORE_PATH_CACHE = tmpdir();
    process.env.CORE_WEBHOOKS_ENABLED = "true";

    await setUpContainer({
        exclude: ["@arkecosystem/core-api", "@arkecosystem/core-graphql", "@arkecosystem/core-forger"],
    });

    await webhookManager.setUp();

    await startServer({
        host: process.env.CORE_WEBHOOKS_HOST || "0.0.0.0",
        port: process.env.CORE_WEBHOOKS_PORT || 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    });
}

export async function tearDown() {
    await app.tearDown();
}
