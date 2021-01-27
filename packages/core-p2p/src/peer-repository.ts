import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { cidr } from "ip";

// todo: review the implementation
@Container.injectable()
export class PeerRepository implements Contracts.P2P.PeerRepository {
    private readonly peers: Map<string, Contracts.P2P.Peer> = new Map<string, Contracts.P2P.Peer>();
    private readonly peersPending: Map<string, Contracts.P2P.Peer> = new Map<string, Contracts.P2P.Peer>();

    public getPeers(): Contracts.P2P.Peer[] {
        return [...this.peers.values()];
    }

    public hasPeers(): boolean {
        return this.peers.size !== 0;
    }

    public getPeer(ip: string): Contracts.P2P.Peer {
        const peer: Contracts.P2P.Peer | undefined = this.peers.get(ip);

        Utils.assert.defined<Contracts.P2P.Peer>(peer);

        return peer;
    }

    public setPeer(peer: Contracts.P2P.Peer): void {
        this.peers.set(peer.ip, peer);
    }

    public forgetPeer(peer: Contracts.P2P.Peer): void {
        this.peers.delete(peer.ip);
    }

    public hasPeer(ip: string): boolean {
        return this.peers.has(ip);
    }

    public getPendingPeers(): Contracts.P2P.Peer[] {
        return [...this.peersPending.values()];
    }

    public hasPendingPeers(): boolean {
        return this.peersPending.size !== 0;
    }

    public getPendingPeer(ip: string): Contracts.P2P.Peer {
        const peer: Contracts.P2P.Peer | undefined = this.peersPending.get(ip);

        Utils.assert.defined<Contracts.P2P.Peer>(peer);

        return peer;
    }

    public setPendingPeer(peer: Contracts.P2P.Peer): void {
        this.peersPending.set(peer.ip, peer);
    }

    public forgetPendingPeer(peer: Contracts.P2P.Peer): void {
        this.peersPending.delete(peer.ip);
    }

    public hasPendingPeer(ip: string): boolean {
        return this.peersPending.has(ip);
    }

    public getSameSubnetPeers(ip: string): Contracts.P2P.Peer[] {
        return this.getPeers().filter((peer) => {
            if (!Utils.IpAddress.isIPv6Address(peer.ip) && !Utils.IpAddress.isIPv6Address(ip)) {
                return cidr(`${peer.ip}/24`) === cidr(`${ip}/24`);
            }

            return false;
        });
    }
}
