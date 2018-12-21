/* tslint:disable:no-shadowed-variable member-ordering */

import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";
import { config as localConfig } from "../config";
import { monitor } from "../monitor";

export class NetworkState {
    public nodeHeight: number;
    public lastBlockId: string;
    public quorum: number;
    public peersQuorum: number;
    public peersNoQuorum: number;
    public overHeightQuorum: number;
    public overHeightBlockHeaders: any[];
    public minimumNetworkReach: boolean;
    public coldStart: boolean;

    private constructor(lastBlock) {
        this.nodeHeight = lastBlock.data.height;
        this.lastBlockId = lastBlock.data.id;

        this.quorum = 0;
        this.peersNoQuorum = 0;
        this.peersQuorum = 0;
        this.overHeightQuorum = 0;
        this.overHeightBlockHeaders = [];
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

        return this.fullyAnalyzedNetwork(lastBlock);
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

    private static fullyAnalyzedNetwork(lastBlock): NetworkState {
        const networkState = new NetworkState(lastBlock);

        const peers = monitor.getPeers();
        const currentSlot = slots.getSlotNumber();

        for (const peer of peers) {
            if (peer.state.height === lastBlock.data.height) {
                if (
                    peer.state.header.id === lastBlock.data.id &&
                    peer.state.currentSlot === currentSlot &&
                    peer.state.forgingAllowed
                ) {
                    networkState.peersQuorum += 1;
                } else {
                    networkState.peersNoQuorum += 1;
                }
            } else if (peer.state.height > lastBlock.data.height) {
                networkState.peersNoQuorum += 1;
                networkState.overHeightQuorum += 1;
                networkState.overHeightBlockHeaders.push(peer.state.header);
            } else if (lastBlock.data.height - peer.state.height < 3) {
                // suppose the max network elasticity accross 3 blocks
                networkState.peersNoQuorum += 1;
            }
        }

        networkState.calculateQuorum();
        return networkState;
    }

    private calculateQuorum() {
        this.quorum = this.peersQuorum / (this.peersQuorum + this.peersNoQuorum);
    }
}
