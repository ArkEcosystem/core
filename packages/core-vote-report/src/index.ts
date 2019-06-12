import { Container } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "vote-report",
    async register(container: Container.IContainer, options) {
        return startServer(options);
    },
    async deregister(container: Container.IContainer) {
        await container.resolvePlugin("vote-report").stop();
    },
};
