import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "wallet-api",
    async register(container: Container.IContainer, options) {
        if (!options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Wallet API is disabled");
            return undefined;
        }

        container.resolvePlugin<Logger.ILogger>("logger").info("Starting Wallet API");
        return startServer(options.server);
    },
    async deregister(container: Container.IContainer, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Wallet API");
            await container.resolvePlugin("wallet-api").stop();
        }
    },
};
