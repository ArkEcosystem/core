import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { create, SCClientSocket } from "socketcluster-client";

import { codec } from "./utils/sc-codec";

// todo: review the implementation
@Container.injectable()
export class PeerConnector implements Contracts.P2P.PeerConnector {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-p2p")
    private readonly configuration!: Providers.PluginConfiguration;

    private readonly connections: Utils.Collection<SCClientSocket> = new Utils.Collection<SCClientSocket>();
    private readonly errors: Map<string, string> = new Map<string, string>();

    public all(): SCClientSocket[] {
        return this.connections.values();
    }

    public connection(peer: Contracts.P2P.Peer): SCClientSocket {
        const connection: SCClientSocket | undefined = this.connections.get(peer.ip);

        Utils.assert.defined<SCClientSocket>(connection);

        return connection;
    }

    public connect(peer: Contracts.P2P.Peer, maxPayload?: number): SCClientSocket {
        const connection = this.connection(peer) || this.create(peer);

        const socket = (connection as any).transport.socket;
        if (maxPayload && socket._receiver) {
            socket._receiver._maxPayload = maxPayload;
        }

        this.connections.set(peer.ip, connection);

        return connection;
    }

    public disconnect(peer: Contracts.P2P.Peer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.destroy();

            this.connections.forget(peer.ip);
        }
    }

    public terminate(peer: Contracts.P2P.Peer): void {
        const connection = this.connection(peer);

        if (connection) {
            (connection as any).transport.socket.terminate();

            this.connections.forget(peer.ip);
        }
    }

    public emit(peer: Contracts.P2P.Peer, event: string, data: any): void {
        this.connection(peer).on(event, data);
    }

    public getError(peer: Contracts.P2P.Peer): string | undefined {
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

    private create(peer: Contracts.P2P.Peer): SCClientSocket {
        const getBlocksTimeout = this.configuration.getRequired<number>("getBlocksTimeout");
        const verifyTimeout = this.configuration.getRequired<number>("verifyTimeout");

        const connection = create({
            port: peer.port,
            hostname: peer.ip,
            ackTimeout: Math.max(getBlocksTimeout, verifyTimeout),
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
