import { Dato } from "@faustbrian/dato";
import { IPeerVerificationResult } from "./peer-verifier";

export interface IPeer {
    readonly url: string;

    ip: string;
    port: number;

    version: string;

    latency: number;
    headers: Record<string, string | number>;
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
    header: Record<string, any>;
}
