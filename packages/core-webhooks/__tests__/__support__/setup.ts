import { app } from "@arkecosystem/core-kernel";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";
import { database } from "../../src/database";
import { webhookManager } from "../../src/manager";
import { startServer } from "../../src/server";

jest.setTimeout(60000);

async function setUp() {
    process.env.CORE_WEBHOOKS_ENABLED = "true";

    await setUpContainer({
        exclude: ["@arkecosystem/core-api", "@arkecosystem/core-graphql", "@arkecosystem/core-forger"],
    });

    await database.setUp({
        dialect: "sqlite",
        storage: `${process.env.CORE_PATH_DATA}/webhooks.sqlite`,
        logging: process.env.CORE_DB_LOGGING,
    });

    await webhookManager.setUp();

    await startServer({
        enabled: false,
        host: process.env.CORE_WEBHOOKS_HOST || "0.0.0.0",
        port: process.env.CORE_WEBHOOKS_PORT || 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
        pagination: {
            limit: 100,
            include: ["/api/webhooks"],
        },
    });
}

async function tearDown() {
    await app.tearDown();
}

export { setUp, tearDown };
