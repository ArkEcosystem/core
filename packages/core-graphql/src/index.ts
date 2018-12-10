import { defaults } from "./defaults";
import { startServer } from "./server";

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "graphql",
    async register(container, options) {
        if (!options.enabled) {
            container.resolvePlugin("logger").info("GraphQL API is disabled :grey_exclamation:");

            return;
        }

        return startServer(options);
    },
    async deregister(container, options) {
        if (options.enabled) {
            container.resolvePlugin("logger").info("Stopping GraphQL API");

            return container.resolvePlugin("graphql").stop();
        }
    },
};
