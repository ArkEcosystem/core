/* tslint:disable:no-shadowed-variable member-ordering max-classes-per-file */

import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { Crypto, Interfaces } from "@arkecosystem/crypto";
import { NetworkStateStatus } from "./enums";

class QuorumDetails implements P2P.IQuorumDetails {
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

export class NetworkState implements P2P.INetworkState {
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

    public static analyze(monitor: P2P.INetworkMonitor, storage: P2P.IPeerStorage): P2P.INetworkState {
        const lastBlock: Interfaces.IBlock = app.resolvePlugin("blockchain").getLastBlock();

        const peers: P2P.IPeer[] = storage.getPeers();
        const minimumNetworkReach: number = app.resolveOptions("p2p").minimumNetworkReach || 20;

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

    public static parse(data: any): P2P.INetworkState {
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

    private static analyzeNetwork(lastBlock, peers: P2P.IPeer[]): P2P.INetworkState {
        const networkState = new NetworkState(NetworkStateStatus.Default, lastBlock);
        const currentSlot = Crypto.Slots.getSlotNumber();

        for (const peer of peers) {
            networkState.update(peer, currentSlot);
        }

        return networkState;
    }

    private update(peer: P2P.IPeer, currentSlot: number): void {
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
