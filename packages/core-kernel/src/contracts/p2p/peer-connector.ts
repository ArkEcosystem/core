import { Client } from "./nes-client";
import { Peer } from "./peer";

export interface PeerConnector {
    all(): Client[];

    connection(peer: Peer): Client | undefined;

    connect(peer: Peer, maxPayload?: number): Promise<Client>;

    disconnect(peer: Peer): void;

    emit(peer: Peer, event: string, payload: any, timeout?: number): Promise<any>;

    getError(peer: Peer): string | undefined;

    setError(peer: Peer, error: string): void;

    hasError(peer: Peer, error: string): boolean;

    forgetError(peer: Peer): void;
}
