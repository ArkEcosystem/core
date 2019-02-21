import { Container, Logger } from "@arkecosystem/core-interfaces";
import { database } from "./database";
import { defaults } from "./defaults";
import { webhookManager } from "./manager";
import { startServer } from "./server";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "webhooks",
    async register(container: Container.IContainer, options) {
        const logger = container.resolvePlugin<Logger.ILogger>("logger");

        if (!options.enabled) {
            logger.info("Webhooks are disabled");

            return;
        }

        await database.setUp(options.database);

        await webhookManager.setUp();

        if (options.server.enabled) {
            return startServer(options.server);
        }

        logger.info("Webhooks API server is disabled");
    },
    async deregister(container: Container.IContainer, options) {
        if (options.server.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Webhook API");

            return container.resolvePlugin("webhooks").stop();
        }
    },
};
