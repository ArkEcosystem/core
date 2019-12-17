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
        this.app.bind(BusinessRegistrationTransactionHandler).toSelf();
        this.app.bind(BusinessResignationTransactionHandler).toSelf();
        this.app.bind(BusinessUpdateTransactionHandler).toSelf();
        this.app.bind(BridgechainRegistrationTransactionHandler).toSelf();
        this.app.bind(BridgechainResignationTransactionHandler).toSelf();
        this.app.bind(BridgechainUpdateTransactionHandler).toSelf();

        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BusinessUpdateTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(BridgechainUpdateTransactionHandler);
    }

    public async boot(): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = this.app.get<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
        );

        walletRepository.registerIndex(MagistrateIndex.Businesses, businessIndexer);
        walletRepository.registerIndex(MagistrateIndex.Bridgechains, bridgechainIndexer);
    }
}
