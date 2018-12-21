import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { database } from "./database";
import { defaults } from "./defaults";
import { webhookManager } from "./manager";
import { startServer } from "./server";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "webhooks",
    async register(container: Container, options) {
        const logger = container.resolvePlugin<AbstractLogger>("logger");

        if (!options.enabled) {
            logger.info("Webhooks are disabled :grey_exclamation:");

            return;
        }

        await database.setUp(options.database);

        await webhookManager.setUp();

        if (options.server.enabled) {
            return startServer(options.server);
        }

        logger.info("Webhooks API server is disabled :grey_exclamation:");
    },
    async deregister(container: Container, options) {
        if (options.server.enabled) {
            container.resolvePlugin<AbstractLogger>("logger").info("Stopping Webhook API");

            return container.resolvePlugin("webhooks").stop();
        }
    },
};
