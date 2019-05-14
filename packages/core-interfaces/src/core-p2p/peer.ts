import { Dato } from "@faustbrian/dato";
import { IPeerVerificationResult } from "./peer-verifier";

export interface IPeerPorts {
    p2p: number;
    [name: string]: number;
}

export interface IPeer {
    readonly url: string;
    readonly port: number;

    readonly ip: string;
    readonly ports: IPeerPorts;

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
    ports: IPeerPorts;
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
