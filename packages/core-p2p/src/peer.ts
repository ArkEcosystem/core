import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { Dato, dato } from "@faustbrian/dato";
import { PeerVerificationResult } from "./peer-verifier";

export class Peer implements P2P.IPeer {
    public readonly ports: P2P.IPeerPorts = {
        p2p: app.resolveOptions("p2p").port,
    };

    public version: string;
    public latency: number;
    public lastPinged: Dato | undefined;
    public verificationResult: PeerVerificationResult | undefined;
    public state: P2P.IPeerState = {
        height: undefined,
        forgingAllowed: undefined,
        currentSlot: undefined,
        header: {},
    };

    constructor(readonly ip: string) {}

    get url(): string {
        return `${this.ports.p2p % 443 === 0 ? "https://" : "http://"}${this.ip}:${this.ports.p2p}`;
    }

    get port(): number {
        return this.ports.p2p;
    }

    public isVerified(): boolean {
        return this.verificationResult instanceof PeerVerificationResult;
    }

    public isForked(): boolean {
        return this.isVerified() && this.verificationResult.forked;
    }

    public recentlyPinged(): boolean {
        return !!this.lastPinged && dato().diffInMinutes(this.lastPinged) < 2;
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
