import { Identifiers as ApiIdentifiers, Server } from "@arkecosystem/core-api";
import { Providers } from "@arkecosystem/core-kernel";

import Handlers from "./handlers";
import { Identifiers } from "./identifiers";
import { EntitySearchService } from "./services";
import { Enums } from "@arkecosystem/core-magistrate-crypto";

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
        const originalNodeFeesHandler = nodeFeesRoute.settings.handler;
        nodeFeesRoute.settings.handler = async (request) => {
            const originalResponse = await originalNodeFeesHandler(request);
            
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
                }
            };
        };
    }

    private extendApiTransactionsFees(server: Server): void {
        const transactionsFeesRoute = server.getRoute("GET", "/api/transactions/fees");
        const originalTransactionsFeesHandler = transactionsFeesRoute.settings.handler;
        transactionsFeesRoute.settings.handler = async (request) => {
            const originalResponse = await originalTransactionsFeesHandler(request);
            
            return {
                ...originalResponse,
                data: {
                    ...originalResponse.data,
                    "2": {
                        entityRegistration: Enums.MagistrateTransactionStaticFees.EntityRegister,
                        entityResignation: Enums.MagistrateTransactionStaticFees.EntityResign,
                        entityUpdate: Enums.MagistrateTransactionStaticFees.EntityUpdate,
                    },
                }
            };
        };
    }
}
