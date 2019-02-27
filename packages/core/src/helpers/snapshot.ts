import { app } from "@arkecosystem/core-container";

// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");

export async function setUpLite(options) {
    process.env.CORE_SKIP_BLOCKCHAIN = "true";

    await app.setUp(version, options, {
        include: [
            "@arkecosystem/core-logger",
            "@arkecosystem/core-logger-pino",
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-snapshots",
        ],
    });

    return app;
}

export async function tearDown() {
    return app.tearDown();
}
