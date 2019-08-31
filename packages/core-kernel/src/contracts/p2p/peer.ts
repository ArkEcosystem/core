import { Dayjs } from "dayjs";

import { PeerVerificationResult } from "./peer-verifier";

export interface PeerPorts {
    [name: string]: number;
}

export interface PeerPlugins {
    [name: string]: { enabled: boolean; port: number };
}

export interface Peer {
    readonly url: string;
    readonly port: number;

    readonly ip: string;
    readonly ports: PeerPorts;

    version: string;

    latency: number;
    state: PeerState;
    plugins: PeerPlugins;
    lastPinged: Dayjs | undefined;
    verificationResult: PeerVerificationResult | undefined;

    isVerified(): boolean;
    isForked(): boolean;
    recentlyPinged(): boolean;

    toBroadcast(): PeerBroadcast;
}

export interface PeerBroadcast {
    ip: string;
    ports: PeerPorts;
    version: string;
    height: number;
    latency: number;
}

export interface PeerState {
    height: number;
    forgingAllowed: boolean;
    currentSlot: number;
    header: Record<string, any>; // @todo: rename, those are block headers but the name is horrible
}
