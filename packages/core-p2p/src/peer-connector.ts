import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import delay from "delay";

import { Client } from "./hapi-nes";

const TEN_SECONDS_IN_MILLISECONDS = 10000;

@Container.injectable()
export class PeerConnector implements Contracts.P2P.PeerConnector {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private readonly connections: Map<string, Client> = new Map<string, Client>();
    private readonly errors: Map<string, string> = new Map<string, string>();
    private readonly lastConnectionCreate: Map<string, number> = new Map<string, number>();

    public all(): Client[] {
        return Array.from(this.connections, ([key, value]) => value);
    }

    public connection(peer: Contracts.P2P.Peer): Client | undefined {
        const connection: Client | undefined = this.connections.get(`${peer.ip}`);

        return connection;
    }

    public async connect(peer: Contracts.P2P.Peer, maxPayload?: number): Promise<Client> {
        if (!this.connection(peer)) {
            // delay a bit if last connection create was less than 10 sec ago to prevent possible abuse of reconnection
            const timeSinceLastConnectionCreate = Date.now() - (this.lastConnectionCreate.get(peer.ip) ?? 0);
            if (timeSinceLastConnectionCreate < TEN_SECONDS_IN_MILLISECONDS) {
                await delay(TEN_SECONDS_IN_MILLISECONDS - timeSinceLastConnectionCreate);
            }
        }
        const connection = this.connection(peer) || (await this.create(peer));

        if (maxPayload) {
            connection.setMaxPayload(maxPayload);
        }

        return connection;
    }

    public disconnect(peer: Contracts.P2P.Peer): void {
        const connection = this.connection(peer);

        if (connection) {
            connection.terminate();

            this.connections.delete(`${peer.ip}`);
        }

        const timeSinceLastConnectionCreate = Date.now() - (this.lastConnectionCreate.get(peer.ip) ?? 0);
        setTimeout(
            () => {
                if (!this.connection(peer)) {
                    this.lastConnectionCreate.delete(peer.ip);
                }
            },
            Math.max(TEN_SECONDS_IN_MILLISECONDS - timeSinceLastConnectionCreate, 0), // always between 0-10 seconds
        );
    }

    public async emit(peer: Contracts.P2P.Peer, event: string, payload: any, timeout?: number): Promise<any> {
        const connection: Client = await this.connect(peer);

        if (timeout) {
            connection.setTimeout(timeout);
        }

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

    private async create(peer: Contracts.P2P.Peer): Promise<Client> {
        const connection = new Client(`ws://${Utils.IpAddress.normalizeAddress(peer.ip)}:${peer.port}`, {
            timeout: 10000,
        });
        this.connections.set(peer.ip, connection);
        this.lastConnectionCreate.set(peer.ip, Date.now());

        connection.onError = (error) => {
            this.logger.debug(`Socket error (peer ${Utils.IpAddress.normalizeAddress(peer.ip)}) : ${error.message}`);
            this.disconnect(peer);
        };

        await connection.connect({ retries: 1, timeout: 5000 });

        return connection;
    }
}
