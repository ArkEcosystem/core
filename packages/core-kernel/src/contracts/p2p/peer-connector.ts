import { Client } from "./nes-client";
import { Peer } from "./peer";

export interface PeerConnector {
    all(): Client[];

    connection(peer: Peer, port: number): Client | undefined;

    connect(peer: Peer, port: number): Promise<Client>;

    disconnect(peer: Peer, port: number): void;

    emit(peer: Peer, port: number, event: string, payload: any): Promise<any>;

    getError(peer: Peer): string | undefined;

    setError(peer: Peer, error: string): void;

    hasError(peer: Peer, error: string): boolean;

    forgetError(peer: Peer): void;
}
