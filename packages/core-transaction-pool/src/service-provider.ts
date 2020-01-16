import { Container, Providers } from "@arkecosystem/core-kernel";

import { Cleaner } from "./cleaner";
import { Collator } from "./collator";
import { Connection } from "./connection";
import { Memory } from "./memory";
import { PoolWalletRepository } from "./pool-wallet-repository";
import { Storage } from "./storage";
import { Synchronizer } from "./synchronizer";

/**
 * @export
 * @class ServiceProvider
 * @extends {Providers.ServiceProvider}
 */
export class ServiceProvider extends Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind(Container.Identifiers.WalletRepository)
            .to(PoolWalletRepository)
            .inSingletonScope()
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "pool"));

        this.app
            .bind(Container.Identifiers.TransactionPoolMemory)
            .to(Memory)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionPoolStorage)
            .to(Storage)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionPoolSynchronizer)
            .to(Synchronizer)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionPoolCleaner)
            .to(Cleaner)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionPoolService)
            .to(Connection)
            .inSingletonScope();

        this.app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);

        this.initializeComponents();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        await this.app.get<Connection>(Container.Identifiers.TransactionPoolService).boot();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async dispose(): Promise<void> {
        this.app.get<Synchronizer>(Container.Identifiers.TransactionPoolSynchronizer).syncToPersistentStorage();

        this.app.get<Storage>(Container.Identifiers.TransactionPoolStorage).disconnect();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        return true;
    }

    /**
     * @private
     * @memberof ServiceProvider
     */
    private initializeComponents(): void {
        this.app.get<Connection>(Container.Identifiers.TransactionPoolService).initialize(this.config().all());

        this.app
            .get<Connection>(Container.Identifiers.TransactionPoolMemory)
            .initialize(this.config().get("maxTransactionAge"));

        this.app
            .get<Connection>(Container.Identifiers.TransactionPoolSynchronizer)
            .initialize(this.config().get("syncInterval"));
    }
}
