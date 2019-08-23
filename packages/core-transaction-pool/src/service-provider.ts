import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Connection } from "./connection";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Connecting to transaction pool");

        const connection = await new ConnectionManager().createConnection(
            new Connection({
                options: this.config().all(),
                walletManager: new WalletManager(),
                memory: new Memory(this.config().get("maxTransactionAge") as number),
                storage: new Storage(),
            }),
        );

        this.app.bind("transactionPool", connection);
        this.app.bind("transactionPool.options", this.config().all());
    }

    public async dispose(): Promise<void> {
        try {
            this.app.resolve<Contracts.Kernel.Log.ILogger>("log").info("Disconnecting from transaction pool");

            this.app.resolve<Contracts.TransactionPool.IConnection>("transactionPool").disconnect();
        } catch (error) {
            // @todo: handle
        }
    }

    public provides(): string[] {
        return ["transactionPool"];
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
