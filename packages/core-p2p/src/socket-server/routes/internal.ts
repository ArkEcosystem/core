import Hapi from "@hapi/hapi";

import { InternalController } from "../controllers/internal";

export const register = (server: Hapi.Server): void => {
    const controller: InternalController = (server.app as any).app.resolve(InternalController);
    server.bind(controller);

    server.route({
        method: 'POST',
        path: '/p2p/internal/acceptNewPeer',
        config: {
            id: 'p2p.internal.acceptNewPeer',
            handler: controller.acceptNewPeer
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/internal/emitEvent',
        config: {
            id: 'p2p.internal.emitEvent',
            handler: controller.emitEvent
        }
    } as any);
    
    server.route({
        method: 'POST',
        path: '/p2p/internal/getUnconfirmedTransactions',
        config: {
            id: 'p2p.internal.getUnconfirmedTransactions',
            handler: controller.getUnconfirmedTransactions
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/internal/getCurrentRound',
        config: {
            id: 'p2p.internal.getCurrentRound',
            handler: controller.getCurrentRound
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/internal/getNetworkState',
        config: {
            id: 'p2p.internal.getNetworkState',
            handler: controller.getNetworkState
        }
    } as any);

    server.route({
        method: 'POST',
        path: '/p2p/internal/syncBlockchain',
        config: {
            id: 'p2p.internal.syncBlockchain',
            handler: controller.syncBlockchain
        }
    } as any);
};
