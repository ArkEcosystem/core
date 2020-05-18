import { Container, Contracts } from "@arkecosystem/core-kernel";
import Nes from "@hapi/nes";

// todo: review the implementation
@Container.injectable()
export class PeerConnector implements Contracts.P2P.PeerConnector {
    private readonly connections: Map<string, Nes.Client> = new Map<string, Nes.Client>();
    private readonly errors: Map<string, string> = new Map<string, string>();

    public all(): Nes.Client[] {
        return Array.from(this.connections, ([key, value]) => value);
    }

    public connection(peer: Contracts.P2P.Peer): Nes.Client | undefined {
        const connection: Nes.Client | undefined = this.connections.get(peer.ip);

        return connection;
    }

    public async connect(peer: Contracts.P2P.Peer, maxPayload?: number): Promise<Nes.Client> {
        const connection = this.connection(peer) || (await this.create(peer));

        this.connections.set(peer.ip, connection);

        return connection;
    }

    public disconnect(peer: Contracts.P2P.Peer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.disconnect();

            this.connections.delete(peer.ip);
        }
    }

    public async emit(peer: Contracts.P2P.Peer, event: string, payload: any): Promise<any> {
        const connection: Nes.Client = await this.connect(peer);
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

    private async create(peer: Contracts.P2P.Peer): Promise<Nes.Client> {
        const connection = new Nes.Client(`ws://${peer.ip}:${peer.port}`);
        await connection.connect();

        return connection;
    }
}
