import { Dayjs } from "dayjs";
import { IPeerVerificationResult } from "./peer-verifier";

export interface IPeerPorts {
    [name: string]: number;
}

export interface IPeerPlugins {
    [name: string]: { enabled: boolean; port: number };
}

export interface IPeer {
    readonly url: string;
    readonly port: number;

    readonly ip: string;
    readonly ports: IPeerPorts;

    version: string;

    latency: number;
    state: IPeerState;
    plugins: IPeerPlugins;
    lastPinged: Dayjs | undefined;
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
