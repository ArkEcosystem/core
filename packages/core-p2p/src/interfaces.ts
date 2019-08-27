import { Contracts } from "@arkecosystem/core-kernel";

export interface PeerData {
    ip: string;
    ports: Contracts.P2P.PeerPorts;
    version: string;
}

export interface PeerConfig {
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
    plugins: Contracts.P2P.PeerPlugins;
}

export interface PeerPingResponse {
    state: Contracts.P2P.PeerState;
    config: PeerConfig;
}
