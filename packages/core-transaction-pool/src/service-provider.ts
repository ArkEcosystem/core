import { Contracts, Support, Types } from "@arkecosystem/core-kernel";
import { Connection } from "./connection";
import { defaults } from "./defaults";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.ILogger>("log").info("Connecting to transaction pool");

        const connection = await new ConnectionManager().createConnection(
            new Connection({
                options: this.opts,
                walletManager: new WalletManager(),
                memory: new Memory(this.opts.maxTransactionAge as number),
                storage: new Storage(),
            }),
        );

        this.app.bind("transactionPool", connection);
        this.app.bind("transactionPool.options", this.opts);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.ILogger>("log").info("Disconnecting from transaction pool");

            this.app.resolve<Contracts.TransactionPool.IConnection>("transactionPool").disconnect();
        } catch (error) {
            // @TODO: handle
        }
    }

    public manifest(): Types.PackageJson {
        return require("../package.json");
    }

    public defaults(): Types.ConfigObject {
        return defaults;
    }

    public provides(): string[] {
        return ["transactionPool"];
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
