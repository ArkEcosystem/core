import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { ForgerManager } from "./manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "forger",
    async register(container: Container.IContainer, options) {
        const forgerManager: ForgerManager = new ForgerManager(options);

        await forgerManager.startForging(options.bip38 as string, options.password as string);

        // Don't keep bip38 password in memory
        delete options.bip38;
        delete options.password;

        return forgerManager;
    },
    async deregister(container: Container.IContainer) {
        const forger = container.resolvePlugin("forger");

        if (forger) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Forger Manager");
            return forger.stopForging();
        }
    },
};
