import { Container, Logger } from "@arkecosystem/core-interfaces";
import pluralize from "pluralize";
import { defaults } from "./defaults";
import { Delegate } from "./delegate";
import { ForgerManager } from "./manager";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "forger",
    async register(container: Container.IContainer, options) {
        const forgerManager: ForgerManager = new ForgerManager(options);
        const forgers: Delegate[] = await forgerManager.loadDelegates(
            options.bip38 as string,
            options.password as string,
        );

        if (!forgers) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Forger is disabled");
            return false;
        }

        // Don't keep bip38 password in memory
        delete options.bip38;
        delete options.password;

        container
            .resolvePlugin<Logger.ILogger>("logger")
            .info(`Forger Manager started with ${pluralize("forger", forgers.length, true)}`);

        forgerManager.startForging();

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
