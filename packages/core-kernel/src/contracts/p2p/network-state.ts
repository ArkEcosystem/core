export interface NetworkState {
    readonly status: any;

    // static analyze(monitor: NetworkMonitor, repository: PeerRepository): NetworkState;
    // static parse(data: any): NetworkState;

    getNodeHeight(): number | undefined;
    getLastBlockId(): string | undefined;

    getQuorum();
    getOverHeightBlockHeaders();
    toJson();
}
