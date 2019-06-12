import { Container, Logger } from "@arkecosystem/core-interfaces";
import { database } from "./database";
import { defaults } from "./defaults";
import { startListeners } from "./listener";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "webhooks",
    async register(container: Container.IContainer, options) {
        if (!options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Webhooks are disabled");
            return undefined;
        }

        database.make();

        startListeners();

        return startServer(options.server);
    },
    async deregister(container: Container.IContainer, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Webhook API");

            await container.resolvePlugin("webhooks").stop();
        }
    },
};
