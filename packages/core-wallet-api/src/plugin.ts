import { Container, Logger } from "@arkecosystem/core-interfaces";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    alias: "wallet-api",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Starting Wallet API");

        return startServer(options);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Wallet API");

        return container.resolvePlugin("wallet-api").stop();
    },
};
