import { app, Contracts } from "@arkecosystem/core-kernel";
import { database } from "./database";
import { defaults } from "./defaults";
import { startListeners } from "./listener";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "webhooks",
    async register(container: Contracts.Kernel.IContainer, options) {
        if (!options.enabled) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Webhooks are disabled");
            return undefined;
        }

        database.make();

        startListeners();

        return startServer(options.server);
    },
    async deregister(container: Contracts.Kernel.IContainer, options) {
        if (options.enabled) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Webhook API");

            await container.resolve("webhooks").stop();
        }
    },
};
