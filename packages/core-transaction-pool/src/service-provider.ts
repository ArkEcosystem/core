import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";

import { Connection } from "./connection";
import { ConnectionManager } from "./manager";
import { Memory } from "./memory";
import { PoolWalletRepository } from "./pool-wallet-repository";
import { Storage } from "./storage";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.log.info("Connecting to transaction pool");

        const maxTransactionAge: number = Utils.assert.defined(this.config().get("maxTransactionAge"));

        const conn = this.app.resolve(Connection);
        const connection = await new ConnectionManager().createConnection(
            // @ts-ignore
            conn.init({
                options: this.config().all(),
                walletRepository: this.app.resolve(PoolWalletRepository),
                memory: this.app.resolve(Memory).init(maxTransactionAge),
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
