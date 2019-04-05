import { app } from "@arkecosystem/core-container";
import { EventEmitter, P2P } from "@arkecosystem/core-interfaces";

export class EventListener {
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    public constructor(service: P2P.IPeerService) {
        const storage = service.getStorage();
        const processor = service.getProcessor();
        const guard = service.getGuard();

        this.emitter.on("internal.p2p.suspendPeer", ({ peer, punishment }) => {
            if (!storage.hasSuspendedPeer(peer)) {
                processor.suspend(peer, punishment ? guard.punishment(punishment) : null);
            }
        });
    }
}
