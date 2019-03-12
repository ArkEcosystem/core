import { Container, Logger } from "@arkecosystem/core-interfaces";
import pluralize from "pluralize";
import { defaults } from "./defaults";
import { ForgerManager } from "./manager";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "forger",
    async register(container: Container.IContainer, options) {
        const forgerManager = new ForgerManager(options);
        const forgers = await forgerManager.loadDelegates(options.bip38, options.password);
        const logger = container.resolvePlugin<Logger.ILogger>("logger");

        if (!forgers) {
            logger.info("Forger is disabled");
            return false;
        }

        // Don't keep bip38 password in memory
        delete options.bip38;
        delete options.password;

        logger.info(`Forger Manager started with ${pluralize("forger", forgers.length, true)}`);

        forgerManager.startForging();

        return forgerManager;
    },
    async deregister(container: Container.IContainer, options) {
        const forger = container.resolvePlugin("forger");

        if (forger) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Forger Manager");
            return forger.stop();
        }
    },
};
