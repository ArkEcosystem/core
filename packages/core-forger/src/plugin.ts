import { Contracts } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { ForgerManager } from "./manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "forger",
    async register(container: Contracts.Kernel.IContainer, options) {
        const forgerManager: ForgerManager = new ForgerManager(options);

        await forgerManager.startForging(options.bip38 as string, options.password as string);

        // Don't keep bip38 password in memory
        delete options.bip38;
        delete options.password;

        return forgerManager;
    },
    async deregister(container: Contracts.Kernel.IContainer) {
        const forger = container.resolve("forger");

        if (forger) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Forger Manager");
            return forger.stopForging();
        }
    },
};
