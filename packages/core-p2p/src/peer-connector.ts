import { app, Contracts } from "@arkecosystem/core-kernel";
import { create, SCClientSocket } from "socketcluster-client";
import { PeerRepository } from "./peer-repository";

export class PeerConnector implements Contracts.P2P.IPeerConnector {
    private readonly connections: PeerRepository<SCClientSocket> = new PeerRepository<SCClientSocket>();
    private readonly errors: Map<string, string> = new Map<string, string>();

    public all(): SCClientSocket[] {
        return this.connections.values();
    }

    public connection(peer: Contracts.P2P.IPeer): SCClientSocket {
        return this.connections.get(peer.ip);
    }

    public connect(peer: Contracts.P2P.IPeer): SCClientSocket {
        let connection = this.connection(peer);

        if (connection) {
            return connection;
        }

        // https://socketcluster.io/#!/docs/api-socketcluster-client
        connection = create({
            port: peer.port,
            hostname: peer.ip,
            ackTimeout: Math.max(app.resolve("p2p.options").getBlocksTimeout, app.resolve("p2p.options").verifyTimeout),
        });

        this.connections.set(peer.ip, connection);

        this.connection(peer).on("error", () => this.disconnect(peer));

        return connection;
    }

    public disconnect(peer: Contracts.P2P.IPeer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.destroy();

            this.connections.forget(peer.ip);
        }
    }

    public emit(peer: Contracts.P2P.IPeer, event: string, data: any): void {
        this.connection(peer).on(event, data);
    }

    public getError(peer: Contracts.P2P.IPeer): string {
        return this.errors.get(peer.ip);
    }

    public setError(peer: Contracts.P2P.IPeer, error: string): void {
        this.errors.set(peer.ip, error);
    }

    public hasError(peer: Contracts.P2P.IPeer, error: string): boolean {
        return this.getError(peer) === error;
    }

    public forgetError(peer: Contracts.P2P.IPeer): void {
        this.errors.delete(peer.ip);
    }
}
