/* tslint:disable:no-shadowed-variable member-ordering max-classes-per-file */

import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../config";
import { Monitor } from "../monitor";
import { Peer } from "../peer";

class QuorumDetails {
    public getQuorum() {
        return this.peersQuorum / (this.peersQuorum + this.peersNoQuorum);
    }

    /**
     * Number of peers on same height, with same block and same slot. Used for
     * quorum calculation.
     */
    public peersQuorum = 0;

    /**
     * Number of peers which do not meet the quorum requirements. Used for
     * quorum calculation.
     */
    public peersNoQuorum = 0;

    /**
     * Number of overheight peers.
     */
    public peersOverHeight = 0;

    /**
     * All overheight block headers grouped by id.
     */
    public peersOverHeightBlockHeaders: { [id: string]: any } = {};

    /**
     * Number of peers which are up to N (=3) blocks below `nodeHeight`.
     * Meaning peers lower than `nodeHeight` - N do not count for quorum.
     */
    public peersOutsideMaxHeightElasticity = 0;

    /**
     * The following properties are not mutual exclusive for a peer
     * and imply a peer is on the same `nodeHeight`.
     */

    /**
     * Number of peers with a different last block id.
     */
    public peersDifferentBlockId = 0;

    /**
     * Number of peers with a different slot.
     */
    public peersDifferentSlot = 0;

    /**
     * Number of peers where forging is not allowed.
     */
    public peersForgingNotAllowed = 0;
}

export enum NetworkStateStatus {
    Default,
    ColdStart,
    BelowMinimumPeers,
    Test,
    Unknown,
}

export class NetworkState {
    private nodeHeight: number;
    private lastBlockId: string;
    private quorumDetails: QuorumDetails;

    public constructor(readonly status: NetworkStateStatus, lastBlock?: any) {
        this.quorumDetails = new QuorumDetails();

        if (lastBlock) {
            this.setLastBlock(lastBlock);
        }
    }

    public setLastBlock(lastBlock) {
        this.nodeHeight = lastBlock.data.height;
        this.lastBlockId = lastBlock.data.id;
    }

    /**
     * Returns the current network state. Peers are updated before the call.
     */
    public static analyze(monitor: Monitor): NetworkState {
        const lastBlock = app.resolvePlugin("blockchain").getLastBlock();

        const peers = monitor.getPeers();
        const minimumNetworkReach = localConfig.get("minimumNetworkReach", 20);

        if (monitor.__isColdStartActive()) {
            return new NetworkState(NetworkStateStatus.ColdStart, lastBlock);
        } else if (process.env.ARK_ENV === "test") {
            return new NetworkState(NetworkStateStatus.Test, lastBlock);
        } else if (peers.length < minimumNetworkReach) {
            return new NetworkState(NetworkStateStatus.BelowMinimumPeers, lastBlock);
        }

        return this.analyzeNetwork(lastBlock, peers);
    }

    public getQuorum() {
        if (this.status === NetworkStateStatus.Test) {
            return 1;
        }

        return this.quorumDetails.getQuorum();
    }

    public getOverHeightBlockHeaders() {
        return Object.values(this.quorumDetails.peersOverHeightBlockHeaders);
    }

    public toJson() {
        const data = { quorum: this.getQuorum() } as any;
        Object.assign(data, this);
        delete data.status;

        return JSON.stringify(data, null, 2);
    }

    private static analyzeNetwork(lastBlock, peers: Peer[]): NetworkState {
        const networkState = new NetworkState(NetworkStateStatus.Default, lastBlock);
        const currentSlot = slots.getSlotNumber();

        for (const peer of peers) {
            networkState.update(peer, currentSlot);
        }

        return networkState;
    }

    private update(peer: Peer, currentSlot: number) {
        if (peer.state.height === this.nodeHeight) {
            let quorum = true;
            if (peer.state.header.id !== this.lastBlockId) {
                quorum = false;
                this.quorumDetails.peersDifferentBlockId++;
            }

            if (peer.state.currentSlot !== currentSlot) {
                quorum = false;
                this.quorumDetails.peersDifferentSlot++;
            }

            if (!peer.state.forgingAllowed) {
                quorum = false;
                this.quorumDetails.peersForgingNotAllowed++;
            }

            quorum ? this.quorumDetails.peersQuorum++ : this.quorumDetails.peersNoQuorum++;
        } else if (peer.state.height > this.nodeHeight) {
            this.quorumDetails.peersNoQuorum++;
            this.quorumDetails.peersOverHeight++;
            this.quorumDetails.peersOverHeightBlockHeaders[peer.state.header.id] = peer.state.header;
        } else if (this.nodeHeight - peer.state.height < 3) {
            // suppose the max network elasticity accross 3 blocks
            this.quorumDetails.peersNoQuorum++;
            this.quorumDetails.peersOutsideMaxHeightElasticity++;
        }
    }
}
