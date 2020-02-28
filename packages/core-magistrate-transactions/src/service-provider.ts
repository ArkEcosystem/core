import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";

import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "./handlers";
import { bridgechainIndexer, businessIndexer, MagistrateIndex } from "./wallet-indexes";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.registerIndexers();

        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessUpdateTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainUpdateTransactionHandler);
    }

    private registerIndexers(): void {
        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: MagistrateIndex.Businesses, indexer: businessIndexer });

        this.app
            .bind<Contracts.State.WalletIndexerIndex>(Container.Identifiers.WalletRepositoryIndexerIndex)
            .toConstantValue({ name: MagistrateIndex.Bridgechains, indexer: bridgechainIndexer });
    }
}
