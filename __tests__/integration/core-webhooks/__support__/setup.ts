import { app } from "@arkecosystem/core-container";
import { tmpdir } from "os";
import { database } from "../../../../packages/core-webhooks/src/database";
import { startServer } from "../../../../packages/core-webhooks/src/server";
import { setUpContainer } from "../../../utils/helpers/container";

export async function setUp() {
    process.env.CORE_PATH_CACHE = tmpdir();
    process.env.CORE_WEBHOOKS_ENABLED = "true";

    await setUpContainer({
        exit: "@arkecosystem/core-logger-pino",
    });

    database.make();

    await startServer({
        host: process.env.CORE_WEBHOOKS_HOST || "0.0.0.0",
        port: process.env.CORE_WEBHOOKS_PORT || 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    });
}

export async function tearDown() {
    await app.tearDown();
}
