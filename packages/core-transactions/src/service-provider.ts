import { Providers } from "@arkecosystem/core-kernel";

import { TransactionHandlerRegistry } from "./handlers/handler-registry";

export class ServiceProvider extends Providers.ServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind("transactionHandlerRegistry")
            .to(TransactionHandlerRegistry)
            .inSingletonScope();
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        return true;
    }
}
