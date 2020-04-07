import { PeerController } from "../controllers/peer";
import { peerSchemas } from "../schemas/peer";
import { Route, RouteConfig } from "./route";

export class PeerRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/peer/getPeers": {
                id: "p2p.peer.getPeers",
                handler: controller.getPeers,
                validation: peerSchemas.getPeers,
            },
            "/p2p/peer/getBlocks": {
                id: "p2p.peer.getBlocks",
                handler: controller.getBlocks,
                validation: peerSchemas.getBlocks,
            },
            "/p2p/peer/getCommonBlocks": {
                id: "p2p.peer.getCommonBlocks",
                handler: controller.getCommonBlocks,
                validation: peerSchemas.getCommonBlocks,
            },
            "/p2p/peer/getStatus": { 
                id: "p2p.peer.getStatus",
                handler: controller.getStatus,
                validation: peerSchemas.getStatus,
            },
            "/p2p/peer/postBlock": {
                id: "p2p.peer.postBlock",
                handler: controller.postBlock,
                validation: peerSchemas.postBlock,
                maxBytes: 20 * 1024 * 1024, // TODO maxBytes for each route
            },
            "/p2p/peer/postTransactions": {
                id: "p2p.peer.postTransactions",
                handler: controller.postTransactions,
                validation: peerSchemas.postTransactions,
            }
        }
    }

    protected getController(): PeerController {
        return this.app.resolve(PeerController);
    }
}
