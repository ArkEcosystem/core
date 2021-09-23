"use strict";
/* tslint:disable:no-shadowed-variable member-ordering max-classes-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const enums_1 = require("./enums");
class QuorumDetails {
    constructor() {
        this.peersQuorum = 0;
        this.peersNoQuorum = 0;
        this.peersOverHeight = 0;
        this.peersOverHeightBlockHeaders = {};
        this.peersForked = 0;
        this.peersDifferentSlot = 0;
        this.peersForgingNotAllowed = 0;
    }
    getQuorum() {
        const quorum = this.peersQuorum / (this.peersQuorum + this.peersNoQuorum);
        return isFinite(quorum) ? quorum : 0;
    }
}
class NetworkState {
    constructor(status, lastBlock) {
        this.status = status;
        this.quorumDetails = new QuorumDetails();
        if (lastBlock) {
            this.setLastBlock(lastBlock);
        }
    }
    setLastBlock(lastBlock) {
        this.nodeHeight = lastBlock.data.height;
        this.lastBlockId = lastBlock.data.id;
    }
    static analyze(monitor, storage) {
        const lastBlock = core_container_1.app.resolvePlugin("blockchain").getLastBlock();
        const peers = storage.getPeers();
        const minimumNetworkReach = core_container_1.app.resolveOptions("p2p").minimumNetworkReach || 20;
        if (monitor.isColdStart()) {
            monitor.completeColdStart();
            return new NetworkState(enums_1.NetworkStateStatus.ColdStart, lastBlock);
        }
        else if (process.env.CORE_ENV === "test") {
            return new NetworkState(enums_1.NetworkStateStatus.Test, lastBlock);
        }
        else if (peers.length < minimumNetworkReach) {
            return new NetworkState(enums_1.NetworkStateStatus.BelowMinimumPeers, lastBlock);
        }
        return this.analyzeNetwork(lastBlock, peers);
    }
    static parse(data) {
        if (!data || data.status === undefined) {
            return new NetworkState(enums_1.NetworkStateStatus.Unknown);
        }
        const networkState = new NetworkState(data.status);
        networkState.nodeHeight = data.nodeHeight;
        networkState.lastBlockId = data.lastBlockId;
        Object.assign(networkState.quorumDetails, data.quorumDetails);
        return networkState;
    }
    getQuorum() {
        if (this.status === enums_1.NetworkStateStatus.Test) {
            return 1;
        }
        return this.quorumDetails.getQuorum();
    }
    getOverHeightBlockHeaders() {
        return Object.values(this.quorumDetails.peersOverHeightBlockHeaders);
    }
    toJson() {
        const data = { quorum: this.getQuorum() };
        Object.assign(data, this);
        delete data.status;
        return JSON.stringify(data, undefined, 2);
    }
    static analyzeNetwork(lastBlock, peers) {
        const networkState = new NetworkState(enums_1.NetworkStateStatus.Default, lastBlock);
        const currentSlot = crypto_1.Crypto.Slots.getSlotNumber();
        for (const peer of peers) {
            networkState.update(peer, currentSlot);
        }
        return networkState;
    }
    update(peer, currentSlot) {
        if (peer.state.height > this.nodeHeight) {
            this.quorumDetails.peersNoQuorum++;
            this.quorumDetails.peersOverHeight++;
            this.quorumDetails.peersOverHeightBlockHeaders[peer.state.header.id] = peer.state.header;
        }
        else {
            if (peer.isForked()) {
                this.quorumDetails.peersNoQuorum++;
                this.quorumDetails.peersForked++;
            }
            else {
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
exports.NetworkState = NetworkState;
//# sourceMappingURL=network-state.js.map