import { emitEvent, getCurrentRound, getNetworkState, getUnconfirmedTransactions, syncBlockchain } from "../codecs/internal";
import { InternalController } from "../controllers/internal";
import { internalSchemas } from "../schemas/internal";
import { Route, RouteConfig } from "./route";

export class InternalRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/internal/emitEvent": {
                id: "p2p.internal.emitEvent",
                handler: controller.emitEvent,
                validation: internalSchemas.emitEvent,
                codec: emitEvent,
            },
            "/p2p/internal/getUnconfirmedTransactions": {
                id: "p2p.internal.getUnconfirmedTransactions",
                handler: controller.getUnconfirmedTransactions,
                codec: getUnconfirmedTransactions,
            },
            "/p2p/internal/getCurrentRound": {
                id: "p2p.internal.getCurrentRound",
                handler: controller.getCurrentRound,
                codec: getCurrentRound,
            },
            "/p2p/internal/getNetworkState": {
                id: "p2p.internal.getNetworkState",
                handler: controller.getNetworkState,
                codec: getNetworkState,
            },
            "/p2p/internal/syncBlockchain": {
                id: "p2p.internal.syncBlockchain",
                handler: controller.syncBlockchain,
                codec: syncBlockchain,
            },
        };
    }

    protected getController(): InternalController {
        return this.app.resolve(InternalController);
    }
}
