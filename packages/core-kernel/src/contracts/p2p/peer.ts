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

    version: string | undefined;
    latency: number | undefined;

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
    version: string | undefined;
    height: number | undefined;
    latency: number | undefined;
}

export interface PeerState {
    height: number | undefined;
    forgingAllowed: boolean | undefined;
    currentSlot: number | undefined;
    header: Record<string, any>; // @todo: rename, those are block headers but the name is horrible
}
