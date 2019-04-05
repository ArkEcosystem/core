import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { Dato } from "@faustbrian/dato";
import { PeerVerificationResult } from "./peer-verifier";

export class Peer implements P2P.IPeer {
    public nethash: string;
    public version: string;
    public os: string;
    // @TODO: rename this to latency
    public delay: number;
    public downloadSize: number;
    public headers: Record<string, string | number>;
    public state: any = {}; // @TODO: add an interface/type
    public lastPinged: Dato | null;
    public verificationResult: PeerVerificationResult | null;

    // @TODO: review and remove them where appropriate
    public status: any;
    public commonBlocks: any;
    public socketError: any;
    public nextSuspensionReminder: any;

    constructor(readonly ip: string, readonly port: number) {
        // @TODO: load data from container
        this.headers = {
            version: app.getVersion(),
            port,
            nethash: app.getConfig().get("network.nethash"),
            height: null,
            "Content-Type": "application/json",
        };
    }

    get url(): string {
        return `${this.port % 443 === 0 ? "https://" : "http://"}${this.ip}:${this.port}`;
    }

    public setHeaders(headers: Record<string, string>): void {
        for (const key of ["nethash", "os", "version"]) {
            this[key] = headers[key] || this[key];
        }
    }

    public isVerified(): boolean {
        return this.verificationResult instanceof PeerVerificationResult;
    }

    public isForked(): boolean {
        return this.isVerified() && this.verificationResult.forked;
    }

    public toBroadcast(): Record<string, any> {
        return {
            ip: this.ip,
            port: +this.port,
            nethash: this.nethash,
            version: this.version,
            os: this.os,
            height: this.state.height,
            delay: this.delay,
        };
    }
}
