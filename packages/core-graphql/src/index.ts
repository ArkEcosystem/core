import { Container, Logger} from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { startServer } from "./server";

/**
 * The struct used by the plugin manager.
 * @type {Object}
 */
export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "graphql",
    async register(container: Container.Container, options) {
        if (!options.enabled) {
            container.resolvePlugin<Logger.Logger>("logger").info("GraphQL API is disabled :grey_exclamation:");
            return;
        }

        return startServer(options);
    },
    async deregister(container: Container.Container, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.Logger>("logger").info("Stopping GraphQL API");

            return container.resolvePlugin("graphql").stop();
        }
    },
};
