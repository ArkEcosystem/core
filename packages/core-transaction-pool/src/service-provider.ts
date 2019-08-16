import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { Connection } from "./connection";
import { defaults } from "./defaults";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Connecting to transaction pool");

        const connection = new ConnectionManager().createConnection(
            new Connection({
                options: this.opts,
                walletManager: new WalletManager(),
                memory: new Memory(this.opts.maxTransactionAge as number),
                storage: new Storage(),
            }),
        );

        this.app.bind("transaction-pool", connection);
        this.app.bind("transaction-pool.options", this.opts);
    }

    public async dispose(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("logger").info("Disconnecting from transaction pool");

        this.app.resolve<Contracts.TransactionPool.IConnection>("transaction-pool").disconnect();
    }

    public getDefaults(): Record<string, any> {
        return defaults;
    }

    public getPackageJson(): Types.PackageJson {
        return require("../package.json");
    }
}
