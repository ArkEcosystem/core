import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Managers } from "@arkecosystem/crypto";
import { start } from "@arkecosystem/exchange-json-rpc";
import { defaults } from "./defaults";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "exchange-json-rpc",
    async register(container: Container.IContainer, options) {
        if (!options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Exchange JSON-RPC Server is disabled");

            return undefined;
        }

        options.network = Managers.configManager.get("network.name");

        return start({
            database: options.database as string,
            server: options,
            logger: container.resolvePlugin<Logger.ILogger>("logger"),
        });
    },
    async deregister(container: Container.IContainer, options) {
        if (options.enabled) {
            container.resolvePlugin<Logger.ILogger>("logger").info("Stopping Exchange JSON-RPC Server");

            return container.resolvePlugin("exchange-json-rpc").stop();
        }
    },
};
