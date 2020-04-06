import Hapi from "@hapi/hapi";

import { peerSchemas } from "../schemas/peer";
import { PeerController } from "../controllers/peer";
import { Route } from "./route";

export class PeerRoute extends Route {
    public static register(server: Hapi.Server): void {
        const controller: PeerController = (server.app as any).app.resolve(PeerController);
        server.bind(controller);

        server.route(
            this.makeRouteObject(
                "p2p.peer.getPeers",
                controller.getPeers,
                peerSchemas["p2p.peer.getPeers"]
            )
        );

        server.route(
            this.makeRouteObject(
                "p2p.peer.getBlocks",
                controller.getBlocks,
                peerSchemas["p2p.peer.getBlocks"]
            )
        );

        server.route(
            this.makeRouteObject(
                "p2p.peer.getCommonBlocks",
                controller.getCommonBlocks,
                peerSchemas["p2p.peer.getCommonBlocks"]
            )
        );

        server.route(
            this.makeRouteObject(
                "p2p.peer.getStatus",
                controller.getStatus,
                peerSchemas["p2p.peer.getStatus"]
            )
        );

        server.route(
            this.makeRouteObject(
                "p2p.peer.postBlock",
                controller.postBlock,
                peerSchemas["p2p.peer.postBlock"],
                20 * 1024 * 1024 // TODO maxBytes for each route
            )
        );

        server.route(
            this.makeRouteObject(
                "p2p.peer.postTransactions",
                controller.postTransactions,
                peerSchemas["p2p.peer.postTransactions"]
            )
        );
    }
}
