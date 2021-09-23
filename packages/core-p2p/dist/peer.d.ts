import { P2P } from "@arkecosystem/core-interfaces";
import { Dayjs } from "dayjs";
import { PeerVerificationResult } from "./peer-verifier";
export declare class Peer implements P2P.IPeer {
    readonly ip: string;
    readonly ports: P2P.IPeerPorts;
    readonly port: number;
    version: string;
    latency: number;
    lastPinged: Dayjs | undefined;
    verificationResult: PeerVerificationResult | undefined;
    state: P2P.IPeerState;
    plugins: P2P.IPeerPlugins;
    constructor(ip: string);
    get url(): string;
    isVerified(): boolean;
    isForked(): boolean;
    recentlyPinged(): boolean;
    toBroadcast(): P2P.IPeerBroadcast;
}
