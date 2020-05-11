import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import {
    ApplyTransactionAction,
    RevertTransactionAction,
    ThrowIfCannotEnterPoolAction,
    VerifyTransactionAction,
} from "./actions";
import { Collator } from "./collator";
import { DynamicFeeMatcher } from "./dynamic-fee-matcher";
import { ExpirationService } from "./expiration-service";
import { FactoryPool } from "./factory-pool";
import { FactoryWorker } from "./factory-worker";
import { Mempool } from "./mempool";
import { Processor } from "./processor";
import { Query } from "./query";
import { SenderMempool } from "./sender-mempool";
import { SenderState } from "./sender-state";
import { Service } from "./service";
import { Storage } from "./storage";

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
        this.registerServices();
        this.registerActions();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        this.app.get<Storage>(Container.Identifiers.TransactionPoolStorage).boot();
        await this.app.get<Service>(Container.Identifiers.TransactionPoolService).boot();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async dispose(): Promise<void> {
        this.app.get<Storage>(Container.Identifiers.TransactionPoolStorage).dispose();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        return true;
    }

    private registerServices(): void {
        this.app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);
        this.app.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).to(DynamicFeeMatcher);
        this.app.bind(Container.Identifiers.TransactionPoolExpirationService).to(ExpirationService);
        this.app.bind(Container.Identifiers.TransactionPoolMempool).to(Mempool).inSingletonScope();
        this.app.bind(Container.Identifiers.TransactionPoolProcessor).to(Processor);
        this.app
            .bind(Container.Identifiers.TransactionPoolProcessorFactory)
            .toAutoFactory(Container.Identifiers.TransactionPoolProcessor);
        this.app.bind(Container.Identifiers.TransactionPoolQuery).to(Query);
        this.app.bind(Container.Identifiers.TransactionPoolSenderMempool).to(SenderMempool);
        this.app
            .bind(Container.Identifiers.TransactionPoolSenderMempoolFactory)
            .toAutoFactory(Container.Identifiers.TransactionPoolSenderMempool);
        this.app.bind(Container.Identifiers.TransactionPoolSenderState).to(SenderState);
        this.app.bind(Container.Identifiers.TransactionPoolService).to(Service).inSingletonScope();
        this.app.bind(Container.Identifiers.TransactionPoolStorage).to(Storage).inSingletonScope();

        this.app.bind(Container.Identifiers.TransactionPoolFactoryPool).to(FactoryPool).inSingletonScope();
        this.app.bind(Container.Identifiers.TransactionPoolFactoryWorker).to(FactoryWorker);
        this.app
            .bind(Container.Identifiers.TransactionPoolFactoryWorkerFactory)
            .toAutoFactory(Container.Identifiers.TransactionPoolFactoryWorker);
    }

    private registerActions(): void {
        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("applyTransaction", new ApplyTransactionAction());

        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("revertTransaction", new RevertTransactionAction());

        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("throwIfCannotEnterPool", new ThrowIfCannotEnterPoolAction());

        this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .bind("verifyTransaction", new VerifyTransactionAction());
    }
}
