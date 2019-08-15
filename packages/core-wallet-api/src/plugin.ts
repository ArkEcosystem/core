import { app, Contracts } from "@arkecosystem/core-kernel";
import { isWhitelisted } from "@arkecosystem/core-utils";
import ip from "ip";
import { defaults } from "./defaults";
import { startServer } from "./server";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "wallet-api",
    depends: "@arkecosystem/core-api",
    async register(container: Contracts.Kernel.IContainer, options) {
        if (!isWhitelisted(container.resolveOptions("api").whitelist, ip.address())) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Wallet API is disabled");

            return undefined;
        }

        return startServer(options.server);
    },
    async deregister(container: Contracts.Kernel.IContainer, options) {
        try {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Wallet API");

            await container.resolve("wallet-api").stop();
        } catch (error) {
            // do nothing...
        }
    },
};
