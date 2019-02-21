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
        if (!options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Webhooks are disabled :grey_exclamation:");
            return;
        }

        database.make();

        await webhookManager.setUp();

        return startServer(options.server);
    },
    async deregister(container: Container.IContainer, options) {
        if (options.server.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Webhook API");

            return container.resolvePlugin("webhooks").stop();
        }
    },
};
