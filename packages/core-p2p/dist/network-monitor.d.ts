import { P2P } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import SocketCluster from "socketcluster";
export declare class NetworkMonitor implements P2P.INetworkMonitor {
    server: SocketCluster;
    config: any;
    nextUpdateNetworkStatusScheduled: boolean;
    private initializing;
    private coldStart;
    /**
     * If downloading some chunk fails but nevertheless we manage to download higher chunks,
     * then they are stored here for later retrieval.
     */
    private downloadedChunksCache;
    /**
     * Maximum number of entries to keep in `downloadedChunksCache`.
     * At 400 blocks per chunk, 100 chunks would amount to 40k blocks.
     */
    private downloadedChunksCacheMax;
    private downloadChunkSize;
    private readonly logger;
    private readonly emitter;
    private readonly communicator;
    private readonly processor;
    private readonly storage;
    private readonly rateLimiter;
    constructor({ communicator, processor, storage, options, }: {
        communicator: P2P.IPeerCommunicator;
        processor: P2P.IPeerProcessor;
        storage: P2P.IPeerStorage;
        options: any;
    });
    getServer(): SocketCluster;
    setServer(server: SocketCluster): void;
    stopServer(): void;
    start(): Promise<void>;
    updateNetworkStatus(initialRun?: boolean): Promise<void>;
    cleansePeers({ fast, forcePing, peerCount, }?: {
        fast?: boolean;
        forcePing?: boolean;
        peerCount?: number;
    }): Promise<void>;
    discoverPeers(pingAll?: boolean): Promise<boolean>;
    getRateLimitStatus(ip: string, endpoint?: string): Promise<P2P.IRateLimitStatus>;
    getRateLimitedEndpoints(): string[];
    isBlockedByRateLimit(ip: string): Promise<boolean>;
    isColdStart(): boolean;
    completeColdStart(): void;
    getNetworkHeight(): number;
    getNetworkState(): Promise<P2P.INetworkState>;
    refreshPeersAfterFork(): Promise<void>;
    checkNetworkHealth(): Promise<P2P.INetworkStatus>;
    downloadBlocksFromHeight(fromBlockHeight: number, maxParallelDownloads?: number): Promise<Interfaces.IBlockData[]>;
    broadcastBlock(block: Interfaces.IBlock): Promise<void>;
    broadcastTransactions(transactions: Interfaces.ITransaction[]): Promise<any>;
    private pingPeerPorts;
    private checkDNSConnectivity;
    private checkNTPConnectivity;
    private scheduleUpdateNetworkStatus;
    private hasMinimumPeers;
    private populateSeedPeers;
}
