import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import { Connection } from "./connection";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { Storage } from "./storage";
import { WalletRepository } from "./wallet-repository";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.log.info("Connecting to transaction pool");

        const connection = await new ConnectionManager().createConnection(
            new Connection({
                options: this.config().all(),
                walletRepository: new WalletRepository(),
                memory: new Memory(this.config().get("maxTransactionAge")),
                storage: new Storage(),
            }),
        );

        this.app.bind(Container.Identifiers.TransactionPoolService).toConstantValue(connection);
    }

    public async dispose(): Promise<void> {
        try {
            this.app.log.info("Disconnecting from transaction pool");

            this.app
                .get<Contracts.TransactionPool.Connection>(Container.Identifiers.TransactionPoolService)
                .disconnect();
        } catch (error) {
            // @todo: handle
        }
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
