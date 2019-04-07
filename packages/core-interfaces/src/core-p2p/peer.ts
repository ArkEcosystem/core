import { Dato } from "@faustbrian/dato";
import { IPeerVerificationResult } from "./peer-verifier";

export interface IPeer {
    readonly url: string;

    ip: string;
    port: number;

    nethash: string;
    version: string;
    os: string;

    latency: number;
    downloadSize: number;
    headers: Record<string, string | number>;
    state: any; // @TODO: add an interface/type
    lastPinged: Dato | null;
    verificationResult: IPeerVerificationResult | null;

    // @TODO: review and remove them where appropriate
    status: any;
    commonBlocks: any;
    socketError: any; // @TODO: store errors in the PeerConnector

    setHeaders(headers: Record<string, string>): void;

    isVerified(): boolean;
    isForked(): boolean;
    recentlyPinged(): boolean;

    toBroadcast(): IPeerBroadcast;
}

export interface IPeerBroadcast {
    ip: string;
    port: number;
    nethash: string;
    version: string;
    os: string;
    height: number;
    latency: number;
}
