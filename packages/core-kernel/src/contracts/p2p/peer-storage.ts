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
