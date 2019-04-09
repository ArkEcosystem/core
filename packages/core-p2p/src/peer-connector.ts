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

    public connect(peer: P2P.IPeer): SCClientSocket {
        let connection = this.connection(peer);

        if (connection) {
            return connection;
        }

        connection = create({
            port: peer.port,
            hostname: peer.ip,
        });

        this.connections.set(peer.ip, connection);

        this.connection(peer).on("error", err => {
            this.logger.debug(`Socket error for peer ${peer.ip}: "${err}"`);

            this.emitter.emit("internal.p2p.suspendPeer", { peer });
        });

        return connection;
    }

    public disconnect(peer: P2P.IPeer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.destroy();
            this.connections.forget(peer.ip);
        }
    }

    public emit(peer: P2P.IPeer, event: string, data: any): void {
        return this.connection(peer).emit(event, data);
    }
}
