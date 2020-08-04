import * as CoreApi from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";
import { Identifiers } from "./identifiers";
import { EntityResourceProvider } from "./services";

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
        this.app.bind(Identifiers.EntityResourceProvider).to(EntityResourceProvider);

        for (const identifier of [CoreApi.Identifiers.HTTP, CoreApi.Identifiers.HTTPS]) {
            if (this.app.isBound<CoreApi.Server>(identifier)) {
                await this.app.get<CoreApi.Server>(identifier).register({
                    plugin: Handlers,
                    routes: { prefix: "/api" }, // todo: add magistrate prefix?
                });
            }
        }
    }
}
