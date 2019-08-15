import { Contracts } from "@arkecosystem/core-kernel";

export interface IPeerData {
    ip: string;
    ports: Contracts.P2P.IPeerPorts;
    version: string;
}

export interface IPeerConfig {
    version: string;
    network: {
        version: string;
        name: string;
        nethash: string;
        explorer: string;
        token: {
            name: string;
            symbol: string;
        };
    };
    plugins: Contracts.P2P.IPeerPlugins;
}

export interface IPeerPingResponse {
    state: Contracts.P2P.IPeerState;
    config: IPeerConfig;
}
