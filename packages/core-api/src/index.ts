import { defaults } from "./defaults";
import { Server } from "./server";

exports.plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "api",
    async register(container, options) {
        if (!options.enabled) {
            container.resolvePlugin("logger").info("Public API is disabled :grey_exclamation:");

            return false;
        }

        const server = new Server(options);
        await server.start();

        return server;
    },
    async deregister(container, options) {
        if (options.enabled) {
            container.resolvePlugin("logger").info(`Stopping Public API`);

            return container.resolvePlugin("api").stop();
        }

        return false;
    },
};
