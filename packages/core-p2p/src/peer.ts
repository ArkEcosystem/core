import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import dayjs, { Dayjs } from "dayjs";
import { PeerVerificationResult } from "./peer-verifier";

export class Peer implements P2P.IPeer {
    public readonly ports: P2P.IPeerPorts = {};
    public readonly port: number = +app.resolveOptions("p2p").server.port;

    public version: string;
    public latency: number;
    public lastPinged: Dayjs | undefined;
    public verificationResult: PeerVerificationResult | undefined;

    public state: P2P.IPeerState = {
        height: undefined,
        forgingAllowed: undefined,
        currentSlot: undefined,
        header: {},
    };

    public plugins: P2P.IPeerPlugins = {};

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

    public toBroadcast(): P2P.IPeerBroadcast {
        return {
            ip: this.ip,
            ports: this.ports,
            version: this.version,
            height: this.state.height,
            latency: this.latency,
        };
    }
}
