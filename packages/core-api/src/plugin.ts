import { Contracts } from "@arkecosystem/core-kernel";
import { defaults } from "./defaults";
import { Server } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "api",
    async register(container: Contracts.Kernel.IContainer, options) {
        if (!options.enabled) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Public API is disabled");

            return false;
        }

        const server = new Server(options);
        await server.start();

        return server;
    },
    async deregister(container: Contracts.Kernel.IContainer, options) {
        if (options.enabled) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info(`Stopping Public API`);

            await container.resolve<Server>("api").stop();
        }
    },
};
