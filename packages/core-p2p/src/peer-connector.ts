import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Client } from "./hapi-nes";

// todo: review the implementation
@Container.injectable()
export class PeerConnector implements Contracts.P2P.PeerConnector {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private readonly connections: Map<string, Client> = new Map<string, Client>();
    private readonly errors: Map<string, string> = new Map<string, string>();

    public all(): Client[] {
        return Array.from(this.connections, ([key, value]) => value);
    }

    public connection(peer: Contracts.P2P.Peer, port: number): Client | undefined {
        const connection: Client | undefined = this.connections.get(`${peer.ip}:${port}`);

        return connection;
    }

    public async connect(peer: Contracts.P2P.Peer, port: number): Promise<Client> {
        const connection = this.connection(peer, port) || (await this.create(peer, port));

        this.connections.set(`${peer.ip}:${port}`, connection);

        return connection;
    }

    public disconnect(peer: Contracts.P2P.Peer, port: number): void {
        const connection = this.connection(peer, port);

        if (connection) {
            connection.disconnect();

            this.connections.delete(`${peer.ip}:${port}`);
        }
    }

    public async emit(peer: Contracts.P2P.Peer, port: number, event: string, payload: any): Promise<any> {
        const connection: Client = await this.connect(peer, port);
        const options = {
            path: event,
            headers: {},
            method: "POST",
            payload,
        };

        return connection.request(options);
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

    private async create(peer: Contracts.P2P.Peer, port: number): Promise<Client> {
        const connection = new Client(`ws://${peer.ip}:${port}`, { timeout: 10000 });

        connection.onError = (error) => {
            this.logger.debug(`Socket error (peer ${peer.ip}) : ${error.message}`);
        };

        await connection.connect({ retries: 1, timeout: 5000 });

        return connection;
    }
}
