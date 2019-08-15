import { Contracts } from "@arkecosystem/core-kernel";
import { ConnectionManager } from "./manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    alias: "database-manager",
    async register(container: Contracts.Kernel.IContainer, options) {
        container.resolve<Contracts.Kernel.ILogger>("logger").info("Starting Database Manager");

        return new ConnectionManager();
    },
};
