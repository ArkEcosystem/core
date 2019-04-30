import { P2P } from "@arkecosystem/core-interfaces";
import { writeFileSync } from "fs";
import { cidr } from "ip";
import { PeerRepository } from "./peer-repository";

export class PeerStorage implements P2P.IPeerStorage {
    private readonly peers: PeerRepository<P2P.IPeer> = new PeerRepository<P2P.IPeer>();
    private readonly peersPending: PeerRepository<P2P.IPeer> = new PeerRepository<P2P.IPeer>();
    private readonly peersSuspended: PeerRepository<P2P.IPeerSuspension> = new PeerRepository<P2P.IPeerSuspension>();

    public getPeers(): P2P.IPeer[] {
        return this.peers.values();
    }

    public hasPeers(): boolean {
        return this.peers.isNotEmpty();
    }

    public getPeer(ip: string): P2P.IPeer {
        return this.peers.get(ip);
    }

    public setPeer(peer: P2P.IPeer): void {
        this.peers.set(peer.ip, peer);
    }

    public forgetPeer(peer: P2P.IPeer): void {
        this.peers.forget(peer.ip);
    }

    public hasPeer(ip: string): boolean {
        return this.peers.has(ip);
    }

    public getPendingPeers(): P2P.IPeer[] {
        return this.peersPending.values();
    }

    public hasPendingPeers(): boolean {
        return this.peersPending.isNotEmpty();
    }

    public getPendingPeer(ip: string): P2P.IPeer {
        return this.peersPending.get(ip);
    }

    public setPendingPeer(peer: P2P.IPeer): void {
        this.peersPending.set(peer.ip, peer);
    }

    public forgetPendingPeer(peer: P2P.IPeer): void {
        this.peersPending.forget(peer.ip);
    }

    public hasPendingPeer(ip: string): boolean {
        return this.peersPending.has(ip);
    }

    public getSuspendedPeers(): P2P.IPeerSuspension[] {
        return this.peersSuspended.values();
    }

    public hasSuspendedPeers(): boolean {
        return this.peersSuspended.isNotEmpty();
    }

    public getSuspendedPeer(ip: string): P2P.IPeerSuspension {
        return this.peersSuspended.get(ip);
    }

    public setSuspendedPeer(suspension: P2P.IPeerSuspension): void {
        this.peersSuspended.set(suspension.peer.ip, suspension);
    }

    public forgetSuspendedPeer(suspension: P2P.IPeerSuspension): void {
        this.peersSuspended.forget(suspension.peer.ip);
    }

    public hasSuspendedPeer(ip: string): boolean {
        return this.peersSuspended.has(ip);
    }

    public getSameSubnetPeers(ip: string): P2P.IPeer[] {
        return this.getPeers().filter(peer => cidr(`${peer.ip}/24`) === cidr(`${ip}/24`));
    }

    public savePeers(): void {
        writeFileSync(
            `${process.env.CORE_PATH_CACHE}/peers.json`,
            JSON.stringify(
                this.getPeers().map(peer => ({
                    ip: peer.ip,
                    port: peer.port,
                    version: peer.version,
                })),
            ),
        );
    }
}
