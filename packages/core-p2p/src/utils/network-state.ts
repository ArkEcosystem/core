/* tslint:disable:no-shadowed-variable member-ordering max-classes-per-file */

import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../config";
import { monitor } from "../monitor";

export class QuorumDetails {
    public peersQuorum = 0;
    public peersNoQuorum = 0;

    public peersDifferentBlockId = 0;
    public peersDifferentSlot = 0;
    public peersForgingNotAllowed = 0;
    public outsideMaxHeightElasticity = 0;
}

export class NetworkState {
    public nodeHeight: number;
    public lastBlockId: string;

    public quorum: number;
    public quorumDetails: QuorumDetails;

    public overHeightQuorum = 0;
    public overHeightBlockHeader = null;

    public minimumNetworkReach: boolean;
    public coldStart: boolean;

    private constructor(lastBlock) {
        this.nodeHeight = lastBlock.data.height;
        this.lastBlockId = lastBlock.data.id;

        this.quorum = 0;
        this.quorumDetails = new QuorumDetails();
        this.minimumNetworkReach = true;
        this.coldStart = false;
    }

    /**
     * Returns the current network state. Peers are update before the call.
     */
    public static analyze(): NetworkState {
        const lastBlock = app.resolvePlugin("blockchain").getLastBlock();

        const peers = monitor.getPeers();
        const minimumNetworkReach = localConfig.get("minimumNetworkReach", 20);

        if (monitor.__isColdStartActive()) {
            return this.coldStartNetwork(lastBlock);
        } else if (process.env.ARK_ENV === "test") {
            return this.testNetwork(lastBlock);
        } else if (peers.length < minimumNetworkReach) {
            return this.belowMinimumPeersNetwork(lastBlock);
        }

        return this.analyzeNetwork(lastBlock);
    }

    private static coldStartNetwork(lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);
        networkState.coldStart = true;

        return networkState;
    }

    private static testNetwork(lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);
        networkState.quorum = 1;

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

        networkState.calculateQuorum();
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
            this.quorumDetails.peersNoQuorum += 1;
        }
    }

    private calculateQuorum() {
        const { peersQuorum, peersNoQuorum } = this.quorumDetails;
        this.quorum = peersQuorum / (peersQuorum + peersNoQuorum);
    }
}
