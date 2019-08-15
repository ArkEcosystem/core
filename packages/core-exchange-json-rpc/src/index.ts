import { Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { start } from "@arkecosystem/exchange-json-rpc";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "exchange-json-rpc",
    async register(container: Contracts.Kernel.IContainer, options) {
        if (!options.enabled) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Exchange JSON-RPC Server is disabled");

            return undefined;
        }

        options.network = Managers.configManager.get("network.name");

        return start({
            database: options.database as string,
            server: options,
            logger: container.resolve<Contracts.Kernel.ILogger>("logger"),
        });
    },
    async deregister(container: Contracts.Kernel.IContainer, options) {
        if (options.enabled) {
            container.resolve<Contracts.Kernel.ILogger>("logger").info("Stopping Exchange JSON-RPC Server");

            return container.resolve("exchange-json-rpc").stop();
        }
    },
};
