import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
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
    async register(container: Container, options) {
        if (!options.enabled) {
            container.resolvePlugin<AbstractLogger>("logger").info("GraphQL API is disabled :grey_exclamation:");
            return;
        }

        return startServer(options);
    },
    async deregister(container: Container, options) {
        if (options.enabled) {
            container.resolvePlugin<AbstractLogger>("logger").info("Stopping GraphQL API");

            return container.resolvePlugin("graphql").stop();
        }
    },
};
