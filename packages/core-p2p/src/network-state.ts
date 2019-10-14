import { app, Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces } from "@arkecosystem/crypto";

import { NetworkStateStatus } from "./enums";

class QuorumDetails implements Contracts.P2P.QuorumDetails {
    public peersQuorum = 0;
    public peersNoQuorum = 0;
    public peersOverHeight = 0;
    public peersOverHeightBlockHeaders: { [id: string]: any } = {};
    public peersForked = 0;
    public peersDifferentSlot = 0;
    public peersForgingNotAllowed = 0;

    public getQuorum() {
        const quorum = this.peersQuorum / (this.peersQuorum + this.peersNoQuorum);

        return isFinite(quorum) ? quorum : 0;
    }
}

// todo: review the implementation
export class NetworkState implements Contracts.P2P.NetworkState {
    public nodeHeight: number;
    public lastBlockId: string;
    private quorumDetails: QuorumDetails;

    public constructor(readonly status: NetworkStateStatus, lastBlock?: Interfaces.IBlock) {
        this.quorumDetails = new QuorumDetails();

        if (lastBlock) {
            this.setLastBlock(lastBlock);
        }
    }

    public setLastBlock(lastBlock: Interfaces.IBlock): void {
        this.nodeHeight = lastBlock.data.height;
        this.lastBlockId = lastBlock.data.id;
    }

    public static analyze(
        monitor: Contracts.P2P.INetworkMonitor,
        storage: Contracts.P2P.PeerStorage,
    ): Contracts.P2P.NetworkState {
        const lastBlock: Interfaces.IBlock = app.get<any>(Container.Identifiers.BlockchainService).getLastBlock();

        const peers: Contracts.P2P.Peer[] = storage.getPeers();
        const minimumNetworkReach: number =
            app
                .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
                .get("@arkecosystem/core-p2p")
                .config()
                .get<number>("minimumNetworkReach") || 20;

        if (monitor.isColdStart()) {
            monitor.completeColdStart();
            return new NetworkState(NetworkStateStatus.ColdStart, lastBlock);
        } else if (process.env.CORE_ENV === "test") {
            return new NetworkState(NetworkStateStatus.Test, lastBlock);
        } else if (peers.length < minimumNetworkReach) {
            return new NetworkState(NetworkStateStatus.BelowMinimumPeers, lastBlock);
        }

        return this.analyzeNetwork(lastBlock, peers);
    }

    public static parse(data: any): Contracts.P2P.NetworkState {
        if (!data || data.status === undefined) {
            return new NetworkState(NetworkStateStatus.Unknown);
        }

        const networkState = new NetworkState(data.status);
        networkState.nodeHeight = data.nodeHeight;
        networkState.lastBlockId = data.lastBlockId;
        Object.assign(networkState.quorumDetails, data.quorumDetails);

        return networkState;
    }

    public getQuorum(): number {
        if (this.status === NetworkStateStatus.Test) {
            return 1;
        }

        return this.quorumDetails.getQuorum();
    }

    public getOverHeightBlockHeaders(): { [id: string]: any } {
        return Object.values(this.quorumDetails.peersOverHeightBlockHeaders);
    }

    public toJson(): string {
        const data = { quorum: this.getQuorum() } as any;
        Object.assign(data, this);
        delete data.status;

        return JSON.stringify(data, undefined, 2);
    }

    private static analyzeNetwork(lastBlock, peers: Contracts.P2P.Peer[]): Contracts.P2P.NetworkState {
        const networkState = new NetworkState(NetworkStateStatus.Default, lastBlock);
        const currentSlot = Crypto.Slots.getSlotNumber();

        for (const peer of peers) {
            networkState.update(peer, currentSlot);
        }

        return networkState;
    }

    private update(peer: Contracts.P2P.Peer, currentSlot: number): void {
        if (peer.state.height > this.nodeHeight) {
            this.quorumDetails.peersNoQuorum++;
            this.quorumDetails.peersOverHeight++;
            this.quorumDetails.peersOverHeightBlockHeaders[peer.state.header.id] = peer.state.header;
        } else {
            if (peer.isForked()) {
                this.quorumDetails.peersNoQuorum++;
                this.quorumDetails.peersForked++;
            } else {
                this.quorumDetails.peersQuorum++;
            }
        }

        // Just statistics in case something goes wrong.
        if (peer.state.currentSlot !== currentSlot) {
            this.quorumDetails.peersDifferentSlot++;
        }

        if (!peer.state.forgingAllowed) {
            this.quorumDetails.peersForgingNotAllowed++;
        }
    }
}
