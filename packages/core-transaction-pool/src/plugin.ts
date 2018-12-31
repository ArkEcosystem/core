import { Container, Logger } from "@arkecosystem/core-interfaces";
import { config } from "./config";
import { TransactionPoolImpl } from "./connection";
import { defaults } from "./defaults";
import { transactionPoolManager } from "./manager";

export const plugin : Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "transactionPool",
    async register(container: Container.Container, options) {
        config.init(options);

        container.resolvePlugin<Logger.Logger>("logger").info("Connecting to transaction pool");

        await transactionPoolManager.makeConnection(new TransactionPoolImpl(options));

        return transactionPoolManager.connection();
    },
    async deregister(container: Container.Container, options) {
        container.resolvePlugin<Logger.Logger>("logger").info("Disconnecting from transaction pool");

        return transactionPoolManager.connection().disconnect();
    },
};
