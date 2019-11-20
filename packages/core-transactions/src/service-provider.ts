import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { TransactionHandlerRegistry } from "./handlers/handler-registry";

export class ServiceProvider extends Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
            .to(Services.Attributes.AttributeSet)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionHandlerRegistry)
            .to(TransactionHandlerRegistry)
            .inSingletonScope();

        this.app.get<TransactionHandlerRegistry>(Container.Identifiers.TransactionHandlerRegistry).init();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        return true;
    }
}
