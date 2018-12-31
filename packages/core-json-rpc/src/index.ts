import { Container } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { startServer } from "./server";
import { database } from "./server/services/database";
import { network } from "./server/services/network";

export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "json-rpc",
    async register(container: Container.Container, options) {
        const logger = container.resolvePlugin<AbstractLogger>("logger");

        if (!options.enabled) {
            logger.info("JSON-RPC Server is disabled :grey_exclamation:");

            return;
        }

        database.init(options.database);

        await network.init();

        return startServer(options);
    },
    async deregister(container: Container.Container, options) {
        if (options.enabled) {
            container.resolvePlugin<AbstractLogger>("logger").info("Stopping JSON-RPC Server");

            return container.resolvePlugin("json-rpc").stop();
        }
    }
};
