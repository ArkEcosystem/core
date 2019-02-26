import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "graphql",
    async register(container: Container.IContainer, options) {
        if (!options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("GraphQL API is disabled");
            return;
        }

        return startServer(options);
    },
    async deregister(container: Container.IContainer, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping GraphQL API");

            return container.resolvePlugin("graphql").stop();
        }
    },
};
