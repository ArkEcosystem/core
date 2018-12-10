import { database } from "./database";
import { defaults } from "./defaults";
import { webhookManager } from "./manager";
import { startServer } from "./server";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "webhooks",
    async register(container, options) {
        const logger = container.resolvePlugin("logger");

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
    async deregister(container, options) {
        if (options.server.enabled) {
            container.resolvePlugin("logger").info("Stopping Webhook API");

            return container.resolvePlugin("webhooks").stop();
        }
    },
};
