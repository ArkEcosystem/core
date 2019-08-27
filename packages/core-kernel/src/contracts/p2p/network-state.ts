export interface NetworkState {
    readonly status: any;

    nodeHeight: number;
    lastBlockId: string;

    // static analyze(monitor: NetworkMonitor, storage: PeerStorage): NetworkState;
    // static parse(data: any): NetworkState;

    setLastBlock(lastBlock);
    getQuorum();
    getOverHeightBlockHeaders();
    toJson();
}

export interface QuorumDetails {
    /**
     * Number of peers on same height, with same block and same slot. Used for
     * quorum calculation.
     */
    peersQuorum: number;

    /**
     * Number of peers which do not meet the quorum requirements. Used for
     * quorum calculation.
     */
    peersNoQuorum: number;

    /**
     * Number of overheight peers.
     */
    peersOverHeight: number;

    /**
     * All overheight block headers grouped by id.
     */
    peersOverHeightBlockHeaders: { [id: string]: any };

    /**
     * The following properties are not mutual exclusive for a peer
     * and imply a peer is on the same `nodeHeight`.
     */

    /**
     * Number of peers that are on a different chain (forked).
     */
    peersForked: number;

    /**
     * Number of peers with a different slot.
     */
    peersDifferentSlot: number;

    /**
     * Number of peers where forging is not allowed.
     */
    peersForgingNotAllowed: number;

    getQuorum(): number;
}
