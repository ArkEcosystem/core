/* tslint:disable:no-shadowed-variable member-ordering max-classes-per-file */

import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../config";
import { Monitor } from "../monitor";
import { Peer } from "../peer";

class QuorumDetails {
    public get quorum() {
        if (process.env.ARK_ENV === "test") {
            return 1;
        }

        return this.peersQuorum / (this.peersQuorum + this.totalNoQuorum);
    }

    public get totalNoQuorum() {
        return this.peersNoQuorum + this.peersOverHeight + this.peersOutsideMaxHeightElasticity;
    }

    /**
     * Number of peers on same height, with same block and same slot.
     */
    public peersQuorum = 0;

    /**
     * Number of peers which do not meet the quorum requirements.
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

export class NetworkState {
    private nodeHeight: number;
    private lastBlockId: string;

    private quorumDetails: QuorumDetails;

    public minimumNetworkReach: boolean;
    public coldStart: boolean;

    private constructor(lastBlock) {
        this.nodeHeight = lastBlock.data.height;
        this.lastBlockId = lastBlock.data.id;

        this.quorumDetails = new QuorumDetails();
        this.minimumNetworkReach = true;
        this.coldStart = false;
    }

    /**
     * Returns the current network state. Peers are updated before the call.
     */
    public static analyze(monitor: Monitor): NetworkState {
        const lastBlock = app.resolvePlugin("blockchain").getLastBlock();

        const peers = monitor.getPeers();
        const minimumNetworkReach = localConfig.get("minimumNetworkReach", 20);

        if (monitor.__isColdStartActive()) {
            return this.coldStartNetwork(lastBlock);
        } else if (peers.length < minimumNetworkReach && process.env.ARK_ENV !== "test") {
            return this.belowMinimumPeersNetwork(lastBlock);
        }

        return this.analyzeNetwork(peers, lastBlock);
    }

    public get quorum() {
        return this.quorumDetails.quorum;
    }

    public getOverHeightBlockHeaders() {
        return Object.values(this.quorumDetails.peersOverHeightBlockHeaders);
    }

    public toJson() {
        return JSON.stringify(this, null, 4);
    }

    private static coldStartNetwork(lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);
        networkState.coldStart = true;

        return networkState;
    }

    private static belowMinimumPeersNetwork(lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);
        networkState.minimumNetworkReach = false;

        return networkState;
    }

    private static analyzeNetwork(peers: Peer[], lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);

        const currentSlot = slots.getSlotNumber();

        for (const peer of peers) {
            networkState.update(peer, currentSlot);
        }

        return networkState;
    }

    private update(peer: Peer, currentSlot) {
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
            this.quorumDetails.peersOverHeight++;
            this.quorumDetails.peersOverHeightBlockHeaders[peer.state.header.id] = peer.state.header;
        } else if (this.nodeHeight - peer.state.height < 3) {
            // suppose the max network elasticity accross 3 blocks
            this.quorumDetails.peersOutsideMaxHeightElasticity++;
        }
    }
}
