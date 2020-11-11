import { Dayjs } from "dayjs";

export interface PeerPorts {
    [name: string]: number;
}

export interface PeerPlugins {
    [name: string]: { enabled: boolean; port: number; estimateTotalCount?: boolean };
}

export interface Peer {
    readonly url: string;
    readonly port: number;

    readonly ip: string;
    readonly ports: PeerPorts;

    version: string | undefined;
    latency: number | undefined;

    state: PeerState;
    plugins: PeerPlugins;
    lastPinged: Dayjs | undefined;
    sequentialErrorCounter: number;
    verificationResult: PeerVerificationResult | undefined;

    isVerified(): boolean;
    isForked(): boolean;
    recentlyPinged(): boolean;

    toBroadcast(): PeerBroadcast;
}

export interface PeerBroadcast {
    ip: string;
    port: number;
}

export interface PeerState {
    height: number | undefined;
    forgingAllowed: boolean | undefined;
    currentSlot: number | undefined;
    header: Record<string, any>; // @todo: rename, those are block headers but the name is horrible
}

export interface PeerData {
    ip: string;
    port: number;
}

export interface PeerConfig {
    version: string;
    network: {
        version: number;
        name: string;
        nethash: string;
        explorer: string;
        token: {
            name: string;
            symbol: string;
        };
    };
    plugins: PeerPlugins;
}

export interface PeerPingResponse {
    state: PeerState;
    config: PeerConfig;
}

export interface PeerVerificationResult {
    readonly myHeight: number;
    readonly hisHeight: number;
    readonly highestCommonHeight: number;
    readonly forked: boolean;
}
