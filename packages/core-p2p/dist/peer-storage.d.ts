import { P2P } from "@arkecosystem/core-interfaces";
export declare class PeerStorage implements P2P.IPeerStorage {
    private readonly peers;
    private readonly peersPending;
    getPeers(): P2P.IPeer[];
    hasPeers(): boolean;
    getPeer(ip: string): P2P.IPeer;
    setPeer(peer: P2P.IPeer): void;
    forgetPeer(peer: P2P.IPeer): void;
    hasPeer(ip: string): boolean;
    getPendingPeers(): P2P.IPeer[];
    hasPendingPeers(): boolean;
    getPendingPeer(ip: string): P2P.IPeer;
    setPendingPeer(peer: P2P.IPeer): void;
    forgetPendingPeer(peer: P2P.IPeer): void;
    hasPendingPeer(ip: string): boolean;
    getSameSubnetPeers(ip: string): P2P.IPeer[];
}
