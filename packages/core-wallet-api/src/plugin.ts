import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "wallet-api",
    async register(container: Container.IContainer, options) {
        return startServer(options.server);
    },
    async deregister(container: Container.IContainer, options) {
        await container.resolvePlugin("wallet-api").stop();
    },
};
