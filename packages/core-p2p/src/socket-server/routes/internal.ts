import Hapi from "@hapi/hapi";

import { InternalController } from "../controllers/internal";
import { internalSchemas } from "../schemas/internal";
import { Route } from "./route";

export class InternalRoute extends Route {
    public static register(server: Hapi.Server): void {
        const controller: InternalController = (server.app as any).app.resolve(InternalController);
        server.bind(controller);

        server.route(
            this.makeRouteConfig(
                "p2p.internal.emitEvent",
                controller.emitEvent,
                internalSchemas["p2p.internal.emitEvent"],
            ),
        );

        server.route(
            this.makeRouteConfig("p2p.internal.getUnconfirmedTransactions", controller.getUnconfirmedTransactions),
        );

        server.route(this.makeRouteConfig("p2p.internal.getCurrentRound", controller.getCurrentRound));

        server.route(this.makeRouteConfig("p2p.internal.getNetworkState", controller.getNetworkState));

        server.route(this.makeRouteConfig("p2p.internal.syncBlockchain", controller.syncBlockchain));
    }
}
