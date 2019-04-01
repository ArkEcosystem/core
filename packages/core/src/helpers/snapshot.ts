import { app } from "@arkecosystem/core-container";
import { Container } from "@arkecosystem/core-interfaces";

// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");

export async function setUpLite(options): Promise<Container.IContainer> {
    await app.setUp(version, options, {
        include: [
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-logger-pino",
            "@arkecosystem/core-database-postgres",
            "@arkecosystem/core-snapshots",
        ],
    });

    return app;
}
