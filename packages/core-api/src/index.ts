import { Container } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { defaults } from "./defaults";
import { Server } from "./server";

exports.plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "api",
    async register(container: Container, options) {
        if (!options.enabled) {
            container.resolvePlugin<AbstractLogger>("logger").info("Public API is disabled :grey_exclamation:");

            return false;
        }

        const server = new Server(options);
        await server.start();

        return server;
    },
    async deregister(container: Container, options) {
        if (options.enabled) {
            container.resolvePlugin<AbstractLogger>("logger").info(`Stopping Public API`);

            return container.resolvePlugin("api").stop();
        }

        return false;
    },
};
