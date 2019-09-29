import { app, Contracts } from "@arkecosystem/core-kernel";
import dayjs, { Dayjs } from "dayjs";

import { PeerVerificationResult } from "./peer-verifier";

// todo: review the implementation
export class Peer implements Contracts.P2P.Peer {
    public readonly ports: Contracts.P2P.PeerPorts = {};
    public readonly port: number = +app.get<any>("p2p.options").server.port;

    public version: string;
    public latency: number;
    public lastPinged: Dayjs | undefined;
    public verificationResult: PeerVerificationResult | undefined;

    public state: Contracts.P2P.PeerState = {
        height: undefined,
        forgingAllowed: undefined,
        currentSlot: undefined,
        header: {},
    };

    public plugins: Contracts.P2P.PeerPlugins = {};

    constructor(readonly ip: string) {}

    get url(): string {
        return `${this.port % 443 === 0 ? "https://" : "http://"}${this.ip}:${this.port}`;
    }

    public isVerified(): boolean {
        return this.verificationResult instanceof PeerVerificationResult;
    }

    public isForked(): boolean {
        return this.isVerified() && this.verificationResult.forked;
    }

    public recentlyPinged(): boolean {
        return !!this.lastPinged && dayjs().diff(this.lastPinged, "minute") < 2;
    }

    public toBroadcast(): Contracts.P2P.PeerBroadcast {
        return {
            ip: this.ip,
            ports: this.ports,
            version: this.version,
            height: this.state.height,
            latency: this.latency,
        };
    }
}
