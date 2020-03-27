import { PeerStorage } from "@arkecosystem/core-p2p/src/peer-storage";
import { Contracts } from "@arkecosystem/core-kernel";

let mockPeers: Partial<Contracts.P2P.Peer>[] = [];

export const setPeers = (peers: Partial<Contracts.P2P.Peer>[]) => {
    mockPeers = peers;
};

class PeerStorageMock implements Partial<PeerStorage> {
    getPeers(): Contracts.P2P.Peer[] {
        return mockPeers as Contracts.P2P.Peer[];
    }

    hasPeer(ip: string): boolean {
        return mockPeers.length > 0;
    }

    getPeer(ip: string): Contracts.P2P.Peer {
        return mockPeers[0] as Contracts.P2P.Peer;
    }
}

export const instance = new PeerStorageMock();
