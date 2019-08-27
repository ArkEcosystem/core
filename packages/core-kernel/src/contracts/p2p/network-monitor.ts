import { Interfaces } from "@arkecosystem/crypto";
import SocketCluster from "socketcluster";
import { NetworkState } from "./network-state";

export interface NetworkStatus {
    forked: boolean;
    blocksToRollback?: number;
}

export interface NetworkMonitor {
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
    getNetworkState(): Promise<NetworkState>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<NetworkStatus>;
    syncWithNetwork(fromBlockHeight: number, maxParallelDownloads?: number): Promise<Interfaces.IBlockData[]>;
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    broadcastTransactions(transactions: Interfaces.ITransaction[]): Promise<void>;
    getServer(): SocketCluster;
    setServer(server: SocketCluster): void;
    stopServer(): void;
}
