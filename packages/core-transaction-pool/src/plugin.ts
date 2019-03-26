import { Container, Logger } from "@arkecosystem/core-interfaces";
import { config } from "./config";
import { TransactionPool } from "./connection";
import { defaults } from "./defaults";
import { transactionPoolManager } from "./manager";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "transaction-pool",
    async register(container: Container.IContainer, options) {
        config.init(options);

        container.resolvePlugin<Logger.ILogger>("logger").info("Connecting to transaction pool");

        await transactionPoolManager.makeConnection(new TransactionPool(options));

        return transactionPoolManager.connection();
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Disconnecting from transaction pool");

        return transactionPoolManager.connection().disconnect();
    },
};
