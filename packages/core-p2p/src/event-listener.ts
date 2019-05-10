import { app } from "@arkecosystem/core-container";
import { EventEmitter, P2P } from "@arkecosystem/core-interfaces";
import SocketCluster from "socketcluster";

export class EventListener {
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    public constructor(service: P2P.IPeerService) {
        const storage: P2P.IPeerStorage = service.getStorage();
        const processor: P2P.IPeerProcessor = service.getProcessor();
        const guard: P2P.IPeerGuard = service.getGuard();

        this.emitter.on("internal.p2p.suspendPeer", ({ peer, punishment }) => {
            if (!storage.hasSuspendedPeer(peer)) {
                processor.suspend(peer, punishment ? guard.punishment(punishment) : undefined);
            }
        });

        const exitHandler = () => {
            const server: SocketCluster = service.getMonitor().getServer();

            if (server) {
                server.removeAllListeners();
                server.destroy();
            }
        };

        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
