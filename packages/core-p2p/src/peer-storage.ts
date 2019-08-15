import { Contracts } from "@arkecosystem/core-kernel";
import { cidr } from "ip";
import { PeerRepository } from "./peer-repository";

export class PeerStorage implements Contracts.P2P.IPeerStorage {
    private readonly peers: PeerRepository<Contracts.P2P.IPeer> = new PeerRepository<Contracts.P2P.IPeer>();
    private readonly peersPending: PeerRepository<Contracts.P2P.IPeer> = new PeerRepository<Contracts.P2P.IPeer>();

    public getPeers(): Contracts.P2P.IPeer[] {
        return this.peers.values();
    }

    public hasPeers(): boolean {
        return this.peers.isNotEmpty();
    }

    public getPeer(ip: string): Contracts.P2P.IPeer {
        return this.peers.get(ip);
    }

    public setPeer(peer: Contracts.P2P.IPeer): void {
        this.peers.set(peer.ip, peer);
    }

    public forgetPeer(peer: Contracts.P2P.IPeer): void {
        this.peers.forget(peer.ip);
    }

    public hasPeer(ip: string): boolean {
        return this.peers.has(ip);
    }

    public getPendingPeers(): Contracts.P2P.IPeer[] {
        return this.peersPending.values();
    }

    public hasPendingPeers(): boolean {
        return this.peersPending.isNotEmpty();
    }

    public getPendingPeer(ip: string): Contracts.P2P.IPeer {
        return this.peersPending.get(ip);
    }

    public setPendingPeer(peer: Contracts.P2P.IPeer): void {
        this.peersPending.set(peer.ip, peer);
    }

    public forgetPendingPeer(peer: Contracts.P2P.IPeer): void {
        this.peersPending.forget(peer.ip);
    }

    public hasPendingPeer(ip: string): boolean {
        return this.peersPending.has(ip);
    }

    public getSameSubnetPeers(ip: string): Contracts.P2P.IPeer[] {
        return this.getPeers().filter(peer => cidr(`${peer.ip}/24`) === cidr(`${ip}/24`));
    }
}
