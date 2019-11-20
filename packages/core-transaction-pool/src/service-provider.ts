import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";

import { Connection } from "./connection";
import { Memory } from "./memory";
import { PoolWalletRepository } from "./pool-wallet-repository";
import { Storage } from "./storage";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.log.info("Connecting to transaction pool");

        const maxTransactionAge: number | undefined = this.config().get("maxTransactionAge");

        Utils.assert.defined<number>(maxTransactionAge);

        this.app
            .bind(Container.Identifiers.TransactionPoolWalletRepository)
            .to(PoolWalletRepository)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionPoolService)
            .to(Connection)
            .inSingletonScope();

        // Initialise the connection with some defaults
        // todo: clean this up, too many params that can be replaced with IoC
        this.app.get<Connection>(Container.Identifiers.TransactionPoolService).init({
            options: this.config().all(),
            memory: this.app.resolve(Memory).init(maxTransactionAge),
            storage: new Storage(),
        });
    }

    public async boot(): Promise<void> {
        await this.app.get<Connection>(Container.Identifiers.TransactionPoolService).make();
    }

    public async dispose(): Promise<void> {
        this.app.get<Contracts.TransactionPool.Connection>(Container.Identifiers.TransactionPoolService).disconnect();
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
