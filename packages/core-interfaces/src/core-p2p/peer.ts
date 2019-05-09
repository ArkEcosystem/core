import { Dato } from "@faustbrian/dato";
import { IPeerVerificationResult } from "./peer-verifier";

export interface IPeer {
    readonly url: string;

    ip: string;
    port: number;

    version: string;

    latency: number;
    state: IPeerState;
    lastPinged: Dato | undefined;
    verificationResult: IPeerVerificationResult | undefined;

    isVerified(): boolean;
    isForked(): boolean;
    recentlyPinged(): boolean;

    toBroadcast(): IPeerBroadcast;
}

export interface IPeerBroadcast {
    ip: string;
    port: number;
    version: string;
    height: number;
    latency: number;
}

export interface IPeerState {
    height: number;
    forgingAllowed: boolean;
    currentSlot: number;
    header: Record<string, any>; // @TODO: rename, those are block headers but the name is horrible
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
    plugins: { [key: string]: { enabled: boolean; port: number } };
}

export interface IPeerPingResponse {
    state: IPeerState;
    config: IPeerConfig;
}
