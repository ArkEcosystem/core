import { app } from "@arkecosystem/core-container";
import { EventEmitter, P2P } from "@arkecosystem/core-interfaces";

export class EventListener {
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    public constructor(service: P2P.IPeerService) {
        const { getStorage, getProcessor, getGuard } = service;

        this.emitter.on("internal.p2p.suspendPeer", ({ peer, punishment }) => {
            if (!getStorage().hasSuspendedPeer(peer)) {
                getProcessor().suspend(peer, getGuard().punishment(punishment));
            }
        });
    }
}
