import { Container, Contracts, Enums, Providers } from "@arkecosystem/core-kernel";

import {
    BridgechainRegistrationTransactionHandler,
    BridgechainResignationTransactionHandler,
    BridgechainUpdateTransactionHandler,
    BusinessRegistrationTransactionHandler,
    BusinessResignationTransactionHandler,
    BusinessUpdateTransactionHandler,
} from "./handlers";
import { bridgechainIndexer, businessIndexer, MagistrateIndex } from "./wallet-manager";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app
            .get<Contracts.Kernel.Events.EventDispatcher>(Container.Identifiers.EventDispatcherService)
            .listenOnce(Enums.Events.State.StateStarting, ({ data }: { data: Contracts.Database.DatabaseService }) => {
                data.walletRepository.registerIndex(MagistrateIndex.Businesses, businessIndexer);
                data.walletRepository.registerIndex(MagistrateIndex.Bridgechains, bridgechainIndexer);
            });

        const transactionHandlerRegistry = this.app.get<any>("transactionHandlerRegistry");
        transactionHandlerRegistry.registerTransactionHandler(BusinessRegistrationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BusinessResignationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BusinessUpdateTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BridgechainRegistrationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BridgechainResignationTransactionHandler);
        transactionHandlerRegistry.registerTransactionHandler(BridgechainUpdateTransactionHandler);
    }
}
