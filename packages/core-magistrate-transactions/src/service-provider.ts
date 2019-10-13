import { Container, Contracts, Providers, Enums } from "@arkecosystem/core-kernel";

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
        const walletRepository = this.app.get<any>(Container.Identifiers.DatabaseService).walletRepository;

        this.app
            .get<Contracts.Kernel.Events.EventDispatcher>("event-emitter")
            .listenOnce(Enums.Events.State.StateStarting, () => {
                walletRepository.registerIndex(MagistrateIndex.Businesses, businessIndexer);
                walletRepository.registerIndex(MagistrateIndex.Bridgechains, bridgechainIndexer);
            });

        this.app
            .get<any>("transactionHandlerRegistry")
            .registerTransactionHandler(BusinessRegistrationTransactionHandler);

        this.app
            .get<any>("transactionHandlerRegistry")
            .registerTransactionHandler(BusinessResignationTransactionHandler);

        this.app.get<any>("transactionHandlerRegistry").registerTransactionHandler(BusinessUpdateTransactionHandler);

        this.app
            .get<any>("transactionHandlerRegistry")
            .registerTransactionHandler(BridgechainRegistrationTransactionHandler);

        this.app
            .get<any>("transactionHandlerRegistry")
            .registerTransactionHandler(BridgechainResignationTransactionHandler);

        this.app.get<any>("transactionHandlerRegistry").registerTransactionHandler(BridgechainUpdateTransactionHandler);
    }
}
