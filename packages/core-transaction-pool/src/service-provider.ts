import { Container, Providers } from "@arkecosystem/core-kernel";

import { Collator } from "./collator";
import { DynamicFeeMatcher } from "./dynamic-fee-matcher";
import { ExpirationService } from "./expiration-service";
import { Memory } from "./memory";
import { Processor } from "./processor";
import { Query } from "./query";
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
        this.app.bind(Container.Identifiers.TransactionPoolCollator).to(Collator);
        this.app.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).to(DynamicFeeMatcher);
        this.app.bind(Container.Identifiers.TransactionPoolExpirationService).to(ExpirationService);
        this.app
            .bind(Container.Identifiers.TransactionPoolMemory)
            .to(Memory)
            .inSingletonScope();
        this.app.bind(Container.Identifiers.TransactionPoolProcessor).to(Processor);
        this.app
            .bind(Container.Identifiers.TransactionPoolProcessorFactory)
            .toAutoFactory(Container.Identifiers.TransactionPoolProcessor);
        this.app.bind(Container.Identifiers.TransactionPoolQuery).to(Query);
        this.app.bind(Container.Identifiers.TransactionPoolSenderState).to(SenderState);
        this.app
            .bind(Container.Identifiers.TransactionPoolSenderStateFactory)
            .toAutoFactory(Container.Identifiers.TransactionPoolSenderState);
        this.app
            .bind(Container.Identifiers.TransactionPoolService)
            .to(Service)
            .inSingletonScope();
        this.app
            .bind(Container.Identifiers.TransactionPoolStorage)
            .to(Storage)
            .inSingletonScope();
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
}
