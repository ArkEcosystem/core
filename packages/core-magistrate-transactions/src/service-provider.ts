import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
    EntityTransactionHandler,
} from "./handlers";
import { bridgechainIndexer, businessIndexer, entityIndexer, entityNameTypeIndexer, MagistrateIndex } from "./wallet-indexes";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessUpdateTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainUpdateTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(EntityTransactionHandler);
    }

    private registerIndexers(): void {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: MagistrateIndex.Businesses, indexer: businessIndexer, autoIndex: true });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: MagistrateIndex.Bridgechains, indexer: bridgechainIndexer, autoIndex: true });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: MagistrateIndex.Entities, indexer: entityIndexer, autoIndex: false });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: MagistrateIndex.EntityNamesTypes, indexer: entityNameTypeIndexer, autoIndex: false });
    }
}
