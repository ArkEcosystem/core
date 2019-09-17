import { app, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { create, SCClientSocket } from "socketcluster-client";

@Container.injectable()
export class PeerConnector implements Contracts.P2P.PeerConnector {
    private readonly connections: Utils.Collection<SCClientSocket> = new Utils.Collection<SCClientSocket>();
    private readonly errors: Map<string, string> = new Map<string, string>();

    public all(): SCClientSocket[] {
        return this.connections.values();
    }

    public connection(peer: Contracts.P2P.Peer): SCClientSocket {
        return this.connections.get(peer.ip);
    }

    public connect(peer: Contracts.P2P.Peer): SCClientSocket {
        let connection = this.connection(peer);

        if (connection) {
            return connection;
        }

        // https://socketcluster.io/#!/docs/api-socketcluster-client
        connection = create({
            port: peer.port,
            hostname: peer.ip,
            ackTimeout: Math.max(
                app.get<any>("p2p.options").getBlocksTimeout,
                app.get<any>("p2p.options").verifyTimeout,
            ),
        });

        this.connections.set(peer.ip, connection);

        this.connection(peer).on("error", () => this.disconnect(peer));

        return connection;
    }

    public disconnect(peer: Contracts.P2P.Peer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.destroy();

            this.connections.forget(peer.ip);
        }
    }

    public emit(peer: Contracts.P2P.Peer, event: string, data: any): void {
        this.connection(peer).on(event, data);
    }

    public getError(peer: Contracts.P2P.Peer): string {
        return this.errors.get(peer.ip);
    }

    public setError(peer: Contracts.P2P.Peer, error: string): void {
        this.errors.set(peer.ip, error);
    }

    public hasError(peer: Contracts.P2P.Peer, error: string): boolean {
        return this.getError(peer) === error;
    }

    public forgetError(peer: Contracts.P2P.Peer): void {
        this.errors.delete(peer.ip);
    }
}
