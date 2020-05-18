import { Interfaces } from "@arkecosystem/crypto";

import { NetworkState } from "./network-state";

export interface NetworkStatus {
    forked: boolean;
    blocksToRollback?: number;
}

export interface IRateLimitStatus {
    blocked: boolean;
    exceededLimitOnEndpoint: boolean;
}

export interface NetworkMonitor {
    boot(): Promise<void>;
    updateNetworkStatus(initialRun?: boolean): Promise<void>;
    cleansePeers({
        fast,
        forcePing,
        peerCount,
    }?: {
        fast?: boolean;
        forcePing?: boolean;
        peerCount?: number;
    }): Promise<void>;
    discoverPeers(initialRun?: boolean): Promise<boolean>;
    getNetworkHeight(): number;
    getNetworkState(): Promise<NetworkState>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<NetworkStatus>;
    downloadBlocksFromHeight(fromBlockHeight: number, maxParallelDownloads?: number): Promise<Interfaces.IBlockData[]>;
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    isColdStart(): boolean;
    completeColdStart(): void;
}
