import { app, Contracts } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "vote-report",
    async register(container: Contracts.Kernel.IContainer, options) {
        return startServer(options);
    },
    async deregister(container: Contracts.Kernel.IContainer) {
        await container.resolve("vote-report").stop();
    },
};
