import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";

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
        const transactionHandlerRegistry = this.app.get<Handlers.Registry>(
            Container.Identifiers.TransactionHandlerRegistry,
        );
        transactionHandlerRegistry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BusinessResignationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BusinessUpdateTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BridgechainResignationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BridgechainUpdateTransactionHandler);
    }

    public async boot(): Promise<void> {
        const walletRepository: Contracts.State.WalletRepository = this.app.get<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
        );

        walletRepository.registerIndex(MagistrateIndex.Businesses, businessIndexer);
        walletRepository.registerIndex(MagistrateIndex.Bridgechains, bridgechainIndexer);
    }
}
