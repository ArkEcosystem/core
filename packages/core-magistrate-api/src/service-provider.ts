import { Identifiers as ApiIdentifiers, Server } from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";
import { Identifiers } from "./identifiers";
import { EntitySearchService } from "./services";

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
        this.app.bind(Identifiers.EntitySearchService).to(EntitySearchService);

        for (const identifier of [ApiIdentifiers.HTTP, ApiIdentifiers.HTTPS]) {
            if (this.app.isBound<Server>(identifier)) {
                await this.app.get<Server>(identifier).register({
                    plugin: Handlers,
                    routes: { prefix: "/api" }, // todo: add magistrate prefix?
                });
            }
        }
    }
}
