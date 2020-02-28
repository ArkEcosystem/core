import { Interfaces } from "@arkecosystem/crypto";
import SocketCluster from "socketcluster";

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
    getRateLimitedEndpoints(): string[];
    getRateLimitStatus(ip: string, endpoint?: string): Promise<IRateLimitStatus>;
    isBlockedByRateLimit(ip: string): Promise<boolean>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<NetworkStatus>;
    downloadBlocksFromHeight(fromBlockHeight: number, maxParallelDownloads?: number): Promise<Interfaces.IBlockData[]>;
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    getServer(): SocketCluster; // remove this
    setServer(server: SocketCluster): void; // remove this
    isColdStart(): boolean;
    completeColdStart(): void;
    dispose(): void;
}
