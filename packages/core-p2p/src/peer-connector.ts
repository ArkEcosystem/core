import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { create, SCClientSocket } from "socketcluster-client";
import { PeerRepository } from "./peer-repository";
import { codec } from "./utils/sc-codec";

export class PeerConnector implements P2P.IPeerConnector {
    private readonly connections: PeerRepository<SCClientSocket> = new PeerRepository<SCClientSocket>();
    private readonly errors: Map<string, string> = new Map<string, string>();

    public all(): SCClientSocket[] {
        return this.connections.values();
    }

    public connection(peer: P2P.IPeer): SCClientSocket {
        return this.connections.get(peer.ip);
    }

    public connect(peer: P2P.IPeer, maxPayload?: number): SCClientSocket {
        const connection = this.connection(peer) || this.create(peer);

        const socket = (connection as any).transport.socket;
        if (maxPayload && socket._receiver) {
            socket._receiver._maxPayload = maxPayload;
        }

        this.connections.set(peer.ip, connection);

        return connection;
    }

    public disconnect(peer: P2P.IPeer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.destroy();

            this.connections.forget(peer.ip);
        }
    }

    public terminate(peer: P2P.IPeer): void {
        const connection = this.connection(peer);

        if (connection) {
            (connection as any).transport.socket.terminate();

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

    private create(peer: P2P.IPeer): SCClientSocket {
        const connection = create({
            port: peer.port,
            hostname: peer.ip,
            ackTimeout: Math.max(app.resolveOptions("p2p").getBlocksTimeout, app.resolveOptions("p2p").verifyTimeout),
            perMessageDeflate: false,
            codecEngine: codec,
        });

        const socket = (connection as any).transport.socket;

        socket.on("ping", () => this.terminate(peer));
        socket.on("pong", () => this.terminate(peer));
        socket.on("message", data => {
            if (data === "#1") {
                // this is to establish some rate limit on #1 messages
                // a simple rate limit of 1 per second doesnt seem to be enough, so decided to give some margin
                // and allow up to 10 per second which should be more than enough
                const timeNow: number = new Date().getTime();
                socket._last10Pings = socket._last10Pings || [];
                socket._last10Pings.push(timeNow);
                if (socket._last10Pings.length >= 10) {
                    socket._last10Pings = socket._last10Pings.slice(socket._last10Pings.length - 10);
                    if (timeNow - socket._last10Pings[0] < 1000) {
                        this.terminate(peer);
                    }
                }
            }
        });

        connection.on("error", () => this.disconnect(peer));

        return connection;
    }
}
