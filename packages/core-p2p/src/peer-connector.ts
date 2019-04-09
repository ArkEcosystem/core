import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { create, SCClientSocket } from "socketcluster-client";
import { PeerRepository } from "./peer-repository";

export class PeerConnector implements P2P.IPeerConnector {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    private readonly connections: PeerRepository<SCClientSocket> = new PeerRepository<SCClientSocket>();

    public all(): SCClientSocket[] {
        return this.connections.values();
    }

    public connection(peer: P2P.IPeer): SCClientSocket {
        return this.connections.get(peer.ip);
    }

    public ensureConnection(peer: P2P.IPeer): SCClientSocket {
        return this.connection(peer) || this.connect(peer);
    }

    public connect(peer: P2P.IPeer): SCClientSocket {
        this.connections.set(
            peer.ip,
            create({
                port: peer.port,
                hostname: peer.ip,
            }),
        );

        this.connection(peer).on("error", err => {
            this.logger.debug(`Socket error for peer ${peer.ip}: "${err}"`);

            this.emitter.emit("internal.p2p.suspendPeer", { peer });
        });

        return this.connection(peer);
    }

    public disconnect(peer: P2P.IPeer): void {
        this.connection(peer).destroy();
    }

    public emit(peer: P2P.IPeer, event: string, data: any): void {
        return this.connection(peer).emit(event, data);
    }
}
