import { IPeer, IPeerResponse } from "./interfaces";
export declare class PeerDiscovery {
    private readonly seeds;
    private version;
    private latency;
    private orderBy;
    private constructor();
    static new({ networkOrHost, defaultPort, }: {
        networkOrHost: string;
        defaultPort?: number;
    }): Promise<PeerDiscovery>;
    getSeeds(): IPeer[];
    withVersion(version: string): PeerDiscovery;
    withLatency(latency: number): PeerDiscovery;
    sortBy(key: string, direction?: string): PeerDiscovery;
    findPeers(opts?: any): Promise<IPeerResponse[]>;
    findPeersWithPlugin(name: string, opts?: {
        additional?: string[];
    }): Promise<IPeer[]>;
}
