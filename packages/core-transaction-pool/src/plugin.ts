import { Container, Logger, TransactionPool } from "@arkecosystem/core-interfaces";
import { Connection } from "./connection";
import { defaults } from "./defaults";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "transaction-pool",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Connecting to transaction pool");

        return new ConnectionManager().createConnection(
            new Connection({
                options,
                walletManager: new WalletManager(),
                memory: new Memory(),
                storage: new Storage(),
            }),
        );
    },
    async deregister(container: Container.IContainer) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Disconnecting from transaction pool");

        return container.resolvePlugin<TransactionPool.IConnection>("transaction-pool").disconnect();
    },
};
