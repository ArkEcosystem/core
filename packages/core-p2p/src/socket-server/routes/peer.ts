import Hapi from "@hapi/hapi";

import { PeerController } from "../controllers/peer";

export const register = (server: Hapi.Server): void => {
    const controller: PeerController = (server.app as any).app.resolve(PeerController);
    server.bind(controller);

    server.route({
        method: 'POST',
        path: '/p2p/peer/getPeers',
        config: {
            id: 'p2p.peer.getPeers',
            handler: controller.getPeers
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/peer/getBlocks',
        config: {
            id: 'p2p.peer.getBlocks',
            handler: controller.getBlocks
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/peer/getCommonBlocks',
        config: {
            id: 'p2p.peer.getCommonBlocks',
            handler: controller.getCommonBlocks
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/peer/getStatus',
        config: {
            id: 'p2p.peer.getStatus',
            handler: controller.getStatus
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/peer/postBlock',
        config: {
            id: 'p2p.peer.postBlock',
            handler: controller.postBlock,
            payload: {
                maxBytes: 20 * 1024 * 1024
            }
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/peer/postTransactions',
        config: {
            id: 'p2p.peer.postTransactions',
            handler: controller.postTransactions
        }
    } as any);
};
