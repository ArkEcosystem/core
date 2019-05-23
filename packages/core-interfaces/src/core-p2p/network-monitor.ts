import { Interfaces } from "@arkecosystem/crypto";
import SocketCluster from "socketcluster";
import { INetworkState } from "./network-state";

export interface INetworkStatus {
    forked: boolean;
    blocksToRollback?: number;
}

export interface INetworkMonitor {
    start(options): Promise<INetworkMonitor>;
    updateNetworkStatus(networkStart?: boolean): Promise<void>;
    cleansePeers(fast?: boolean, forcePing?: boolean): Promise<void>;
    discoverPeers(): Promise<void>;
    getNetworkHeight(): number;
    getNetworkState(): Promise<INetworkState>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<INetworkStatus>;
    isColdStartActive(): boolean;
    syncWithNetwork(fromBlockHeight: number, maxParallelDownloads?: number): Promise<Interfaces.IBlockData[]>;
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    broadcastTransactions(transactions: Interfaces.ITransaction[]): Promise<void>;
    getServer(): SocketCluster;
    setServer(server: SocketCluster): void;
    stopServer(): void;
}
