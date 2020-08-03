import { Contracts } from "@arkecosystem/core-kernel";

export type PeerCriteria = Contracts.Search.StandardCriteriaOf<PeerResource>;

export type PeerResourcesPage = Contracts.Search.Page<PeerResource>;

export type PeerResource = {
    ip: string;
    port: number;
    version?: string;
    height?: number;
    latency?: number;
    plugins?: PeerResourcePlugins;
};

export type PeerResourcePlugins = {
    [name: string]: {
        enabled: boolean;
        port: number;
        estimateTotalCount?: boolean;
    };
};
