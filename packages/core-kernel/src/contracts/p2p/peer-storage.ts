import { Peer } from "./peer";

export interface PeerStorage {
    getPeers(): Peer[];
    hasPeers(): boolean;
    getPeer(ip: string): Peer;
    setPeer(peer: Peer): void;
    forgetPeer(peer: Peer): void;
    hasPeer(ip: string): boolean;

    getPendingPeers(): Peer[];
    hasPendingPeers(): boolean;
    getPendingPeer(ip: string): Peer;
    setPendingPeer(peer: Peer): void;
    forgetPendingPeer(peer: Peer): void;
    hasPendingPeer(ip: string): boolean;

    getSameSubnetPeers(ip: string): Peer[];
}

export interface PeerRepository<T> {
    all(): Map<string, T>;
    entries(): Array<[string, T]>;
    keys(): string[];
    values(): T[];

    pull(ip: string): T;
    get(ip: string): T;
    set(ip: string, peer: T): void;

    forget(ip: string): void;
    flush(): void;

    has(ip: string): boolean;
    missing(ip: string): boolean;
    count(): number;
    isEmpty(): boolean;
    isNotEmpty(): boolean;

    random(): T;

    toJson(): string;
}
