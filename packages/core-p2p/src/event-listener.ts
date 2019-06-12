import { app } from "@arkecosystem/core-container";
import { EventEmitter, P2P } from "@arkecosystem/core-interfaces";

export class EventListener {
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    public constructor(service: P2P.IPeerService) {
        const connector: P2P.IPeerConnector = service.getConnector();

        this.emitter.on("internal.p2p.disconnectPeer", ({ peer }) => connector.disconnect(peer));

        const exitHandler = () => service.getMonitor().stopServer();

        process.on("SIGINT", exitHandler);
        process.on("exit", exitHandler);
    }
}
