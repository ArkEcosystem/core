/* tslint:disable:no-shadowed-variable member-ordering max-classes-per-file */

import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../config";
import { monitor } from "../monitor";

class QuorumDetails {
    public get quorum() {
        if (process.env.ARK_ENV === "test") {
            return 1;
        }

        return this.peersQuorum / (this.peersQuorum + this.peersNoQuorum + this.peersOutsideMaxHeightElasticity);
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
     * Number of peers which are up to N (=3) blocks below `nodeHeight`
     */
    public peersOutsideMaxHeightElasticity = 0;

    /**
     * The following properties are not mutual exclusive for a peer
     * and are only increased when on the same `nodeHeight`.
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
    public nodeHeight: number;
    public lastBlockId: string;

    public quorumDetails: QuorumDetails;

    public overHeightQuorum = 0;
    public overHeightBlockHeader = null;

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
    public static analyze(): NetworkState {
        const lastBlock = app.resolvePlugin("blockchain").getLastBlock();

        const peers = monitor.getPeers();
        const minimumNetworkReach = localConfig.get("minimumNetworkReach", 20);

        if (monitor.__isColdStartActive()) {
            return this.coldStartNetwork(lastBlock);
        } else if (peers.length < minimumNetworkReach && process.env.ARK_ENV !== "test") {
            return this.belowMinimumPeersNetwork(lastBlock);
        }

        return this.analyzeNetwork(lastBlock);
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

    private static analyzeNetwork(lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);

        const peers = monitor.getPeers();
        const currentSlot = slots.getSlotNumber();

        for (const peer of peers) {
            networkState.update(peer, currentSlot);
        }

        return networkState;
    }

    private update(peer, currentSlot) {
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
            this.overHeightQuorum++;
            this.overHeightBlockHeader = peer.state.header;
        } else if (this.nodeHeight - peer.state.height < 3) {
            // suppose the max network elasticity accross 3 blocks
            this.quorumDetails.peersOutsideMaxHeightElasticity++;
        }
    }
}
