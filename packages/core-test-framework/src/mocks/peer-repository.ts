import { Contracts } from "@arkecosystem/core-kernel";
import { PeerRepository } from "@arkecosystem/core-p2p";

let mockPeers: Partial<Contracts.P2P.Peer>[] = [];

export const setPeers = (peers: Partial<Contracts.P2P.Peer>[]) => {
    mockPeers = peers;
};

class PeerRepositoryMock implements Partial<PeerRepository> {
    public getPeers(): Contracts.P2P.Peer[] {
        return mockPeers as Contracts.P2P.Peer[];
    }

    public hasPeer(ip: string): boolean {
        return mockPeers.length > 0;
    }

    public getPeer(ip: string): Contracts.P2P.Peer {
        return mockPeers[0] as Contracts.P2P.Peer;
    }
}

export const instance = new PeerRepositoryMock();
