import { Interfaces } from "@arkecosystem/crypto";
import SocketCluster from "socketcluster";
import { INetworkState } from "./network-state";

export interface INetworkStatus {
    forked: boolean;
    blocksToRollback?: number;
}

export interface IRateLimitStatus {
    blocked: boolean;
    exceededLimitOnEndpoint: boolean;
}

export interface INetworkMonitor {
    start(): Promise<void>;
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
    getNetworkState(): Promise<INetworkState>;
    getRateLimitedEndpoints(): string[];
    getRateLimitStatus(ip: string, endpoint?: string): Promise<IRateLimitStatus>;
    isBlockedByRateLimit(ip: string): Promise<boolean>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<INetworkStatus>;
    downloadBlocksFromHeight(fromBlockHeight: number, maxParallelDownloads?: number): Promise<Interfaces.IBlockData[]>;
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    broadcastTransactions(transactions: Interfaces.ITransaction[]): Promise<void>;
    getServer(): SocketCluster;
    setServer(server: SocketCluster): void;
    isColdStart(): boolean;
    completeColdStart(): void;
    stopServer(): void;
}
