import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";
import { database } from "./server/services/database";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "json-rpc",
    async register(container: Container.IContainer, options) {
        const logger = container.resolvePlugin<Logger.ILogger>("logger");

        if (!options.enabled) {
            logger.info("JSON-RPC Server is disabled");

            return undefined;
        }

        database.init(options.database);

        return startServer(options);
    },
    async deregister(container: Container.IContainer, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping JSON-RPC Server");

            return container.resolvePlugin("json-rpc").stop();
        }
    },
};
