import { Contracts, Support } from "@arkecosystem/core-kernel";
import { Connection } from "./connection";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletManager } from "./wallet-manager";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Connecting to transaction pool");

        const connection = await new ConnectionManager().createConnection(
            new Connection({
                options: this.config().all(),
                walletManager: new WalletManager(),
                memory: new Memory(this.config().get("maxTransactionAge") as number),
                storage: new Storage(),
            }),
        );

        this.ioc.bind("transactionPool").toConstantValue(connection);
        this.ioc.bind("transactionPool.options").toConstantValue(this.config().all());
    }

    public async dispose(): Promise<void> {
        try {
            this.ioc.get<Contracts.Kernel.Log.ILogger>("log").info("Disconnecting from transaction pool");

            this.ioc.get<Contracts.TransactionPool.IConnection>("transactionPool").disconnect();
        } catch (error) {
            // @todo: handle
        }
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
