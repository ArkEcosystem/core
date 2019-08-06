import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { create, SCClientSocket } from "socketcluster-client";
import { PeerRepository } from "./peer-repository";

export class PeerConnector implements P2P.IPeerConnector {
    private readonly connections: PeerRepository<SCClientSocket> = new PeerRepository<SCClientSocket>();
    private readonly errors: Map<string, string> = new Map<string, string>();

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

        // https://socketcluster.io/#!/docs/api-socketcluster-client
        connection = create({
            port: peer.port,
            hostname: peer.ip,
            ackTimeout: Math.max(app.resolveOptions("p2p").getBlocksTimeout, app.resolveOptions("p2p").verifyTimeout),
        });

        this.connections.set(peer.ip, connection);

        this.connection(peer).on("error", () => this.disconnect(peer));

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
        this.connection(peer).emit(event, data);
    }

    public getError(peer: P2P.IPeer): string {
        return this.errors.get(peer.ip);
    }

    public setError(peer: P2P.IPeer, error: string): void {
        this.errors.set(peer.ip, error);
    }

    public hasError(peer: P2P.IPeer, error: string): boolean {
        return this.getError(peer) === error;
    }

    public forgetError(peer: P2P.IPeer): void {
        this.errors.delete(peer.ip);
    }
}
