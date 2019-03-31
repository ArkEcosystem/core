import { Container, Logger, TransactionPool } from "@arkecosystem/core-interfaces";
import { config } from "./config";
import { Connection } from "./connection";
import { defaults } from "./defaults";
import { ConnectionManager } from "./manager";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "transaction-pool",
    async register(container: Container.IContainer, options) {
        config.init(options);

        container.resolvePlugin<Logger.ILogger>("logger").info("Connecting to transaction pool");

        const connectionManager: ConnectionManager = new ConnectionManager();

        return connectionManager.createConnection(new Connection(options));
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Disconnecting from transaction pool");

        return container.resolvePlugin<TransactionPool.IConnection>("transaction-pool").disconnect();
    },
};
