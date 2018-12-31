import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { Server } from "./server";

export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "api",
    async register(container: Container.Container, options) {
        if (!options.enabled) {
            container.resolvePlugin<Logger.Logger>("logger").info("Public API is disabled :grey_exclamation:");

            return false;
        }

        const server = new Server(options);
        await server.start();

        return server;
    },
    async deregister(container: Container.Container, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.Logger>("logger").info(`Stopping Public API`);

            return container.resolvePlugin("api").stop();
        }

        return false;
    },
};
