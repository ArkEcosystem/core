import { Container, Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { database } from "./database";
import { defaults } from "./defaults";
import { webhookManager } from "./manager";
import { startServer } from "./server";

export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "webhooks",
    async register(container: Container.Container, options) {
        const logger = container.resolvePlugin<Logger.Logger>("logger");

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
    async deregister(container: Container.Container, options) {
        if (options.server.enabled) {
            container.resolvePlugin<Logger.Logger>("logger").info("Stopping Webhook API");

            return container.resolvePlugin("webhooks").stop();
        }
    },
};
