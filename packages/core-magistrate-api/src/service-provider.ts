import { Identifiers as ApiIdentifiers, Server } from "@arkecosystem/core-api";
import { Providers, Utils } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

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
                const server: Server = this.app.get<Server>(identifier);

                await server.register({
                    plugin: Handlers,
                    routes: { prefix: "/api" }, // todo: add magistrate prefix?
                });

                this.extendApiNodeFees(server);
                this.extendApiTransactionsFees(server);
            }
        }
    }

    private extendApiNodeFees(server: Server): void {
        const nodeFeesRoute = server.getRoute("GET", "/api/node/fees");
        Utils.assert.defined<Hapi.RequestRoute>(nodeFeesRoute);

        const originalNodeFeesHandler = nodeFeesRoute.settings.handler as Hapi.Lifecycle.Method;
        nodeFeesRoute.settings.handler = async (request, h) => {
            const originalResponse = (await originalNodeFeesHandler(request, h)) as { data: any };

            if (Managers.configManager.getMilestone().aip36 !== true) {
                return originalResponse;
            }

            return {
                ...originalResponse,
                data: {
                    ...originalResponse.data,
                    "2": {
                        entityRegistration: {
                            avg: Enums.MagistrateTransactionStaticFees.EntityRegister,
                            max: Enums.MagistrateTransactionStaticFees.EntityRegister,
                            min: Enums.MagistrateTransactionStaticFees.EntityRegister,
                            sum: "0",
                        },
                        entityResignation: {
                            avg: Enums.MagistrateTransactionStaticFees.EntityResign,
                            max: Enums.MagistrateTransactionStaticFees.EntityResign,
                            min: Enums.MagistrateTransactionStaticFees.EntityResign,
                            sum: "0",
                        },
                        entityUpdate: {
                            avg: Enums.MagistrateTransactionStaticFees.EntityUpdate,
                            max: Enums.MagistrateTransactionStaticFees.EntityUpdate,
                            min: Enums.MagistrateTransactionStaticFees.EntityUpdate,
                            sum: "0",
                        },
                    },
                },
            };
        };
    }

    private extendApiTransactionsFees(server: Server): void {
        const transactionsFeesRoute = server.getRoute("GET", "/api/transactions/fees");
        Utils.assert.defined<Hapi.RequestRoute>(transactionsFeesRoute);

        const originalTransactionsFeesHandler = transactionsFeesRoute.settings.handler as Hapi.Lifecycle.Method;
        transactionsFeesRoute.settings.handler = async (request, h) => {
            const originalResponse = (await originalTransactionsFeesHandler(request, h)) as { data: any };

            if (Managers.configManager.getMilestone().aip36 !== true) {
                return originalResponse;
            }

            return {
                ...originalResponse,
                data: {
                    ...originalResponse.data,
                    "2": {
                        entityRegistration: Enums.MagistrateTransactionStaticFees.EntityRegister,
                        entityResignation: Enums.MagistrateTransactionStaticFees.EntityResign,
                        entityUpdate: Enums.MagistrateTransactionStaticFees.EntityUpdate,
                    },
                },
            };
        };
    }
}
