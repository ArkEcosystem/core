import { Contracts, Providers } from "@arkecosystem/core-kernel";
import { Connection } from "./connection";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export class ServiceProvider extends Providers.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.get<Contracts.Kernel.Log.Logger>("log").info("Connecting to transaction pool");

        const connection = await new ConnectionManager().createConnection(
            new Connection({
                options: this.config().all(),
                walletManager: new WalletManager(),
                memory: new Memory(this.config().get("maxTransactionAge")),
                storage: new Storage(),
            }),
        );

        this.app.bind("transactionPool").toConstantValue(connection);
        this.app.bind("transactionPool.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        try {
            this.app.get<Contracts.Kernel.Log.Logger>("log").info("Disconnecting from transaction pool");

            this.app.get<Contracts.TransactionPool.Connection>("transactionPool").disconnect();
        } catch (error) {
            // @todo: handle
        }
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
