export interface NetworkState {
    readonly status: any;

    nodeHeight: number | undefined;
    lastBlockId: string | undefined;

    // static analyze(monitor: NetworkMonitor, storage: PeerStorage): NetworkState;
    // static parse(data: any): NetworkState;

    setLastBlock(lastBlock);
    getQuorum();
    getOverHeightBlockHeaders();
    toJson();
}
