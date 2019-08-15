import { Contracts } from "@arkecosystem/core-kernel";
import { Connection } from "./connection";
import { defaults } from "./defaults";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    required: true,
    alias: "transaction-pool",
    async register(container: Contracts.Kernel.IContainer, options) {
        container.resolve<Contracts.Kernel.ILogger>("logger").info("Connecting to transaction pool");

        return new ConnectionManager().createConnection(
            new Connection({
                options,
                walletManager: new WalletManager(),
                memory: new Memory(options.maxTransactionAge as number),
                storage: new Storage(),
            }),
        );
    },
    async deregister(container: Contracts.Kernel.IContainer) {
        container.resolve<Contracts.Kernel.ILogger>("logger").info("Disconnecting from transaction pool");

        return container.resolve<Contracts.TransactionPool.IConnection>("transaction-pool").disconnect();
    },
};
