import { Identifiers, Server } from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";

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
        for (const identifier of [Identifiers.HTTP, Identifiers.HTTPS]) {
            if (this.app.isBound<Server>(identifier)) {
                await this.app.get<Server>(identifier).register({
                    plugin: Handlers,
                    routes: { prefix: "/api" }, // todo: add magistrate prefix?
                });
            }
        }
    }
}
