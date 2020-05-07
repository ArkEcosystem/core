import { Container, Providers } from "@arkecosystem/core-kernel";
import { CryptoManager } from "@arkecosystem/crypto";

import * as Interfaces from "./interfaces";

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
        this.app
            .bind<CryptoManager<Interfaces.IBlockData>>(Container.Identifiers.CryptoManager)
            .to(CryptoManager)
            .inSingletonScope();
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {}

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async dispose(): Promise<void> {}
}
