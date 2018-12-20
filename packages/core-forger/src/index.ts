import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import pluralize from "pluralize";
import { defaults } from "./defaults";
import { ForgerManager } from "./manager";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "forger",
    async register(container: Container, options) {
        const forgerManager = new ForgerManager(options);
        const forgers = await forgerManager.loadDelegates(options.bip38, options.password);
        const logger = container.resolvePlugin<AbstractLogger>("logger");

        if (!forgers) {
            logger.info("Forger is disabled :grey_exclamation:");
            return false;
        }

        // Don't keep bip38 password in memory
        delete process.env.ARK_FORGER_PASSWORD;
        delete options.password;

        logger.info(`Forger Manager started with ${pluralize("forger", forgers.length, true)}`);

        forgerManager.startForging();

        return forgerManager;
    },
    async deregister(container: Container, options) {
        const forger = container.resolvePlugin("forger");

        if (forger) {
            container.resolvePlugin<AbstractLogger>("logger").info("Stopping Forger Manager");
            return forger.stop();
        }
    },
};
