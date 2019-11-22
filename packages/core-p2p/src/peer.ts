import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import dayjs, { Dayjs } from "dayjs";

import { PeerVerificationResult } from "./peer-verifier";

// todo: review the implementation
export class Peer implements Contracts.P2P.Peer {
    public readonly ports: Contracts.P2P.PeerPorts = {};
    public port: number;

    public version: string | undefined;
    public latency: number | undefined;
    public lastPinged: Dayjs | undefined;
    public verificationResult: PeerVerificationResult | undefined;

    public state: Contracts.P2P.PeerState = {
        height: undefined,
        forgingAllowed: undefined,
        currentSlot: undefined,
        header: {},
    };

    public plugins: Contracts.P2P.PeerPlugins = {};

    // todo: get rid of the app argument so that the entity is detached from the container.
    constructor(app: Contracts.Kernel.Application, readonly ip: string) {
        const config: Providers.PluginConfiguration | undefined = app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("p2p")
            .config();

        Utils.assert.defined<Providers.PluginConfiguration>(config);

        const port: number | undefined = config.get<number>("server.port");

        Utils.assert.defined<number>(port);

        this.port = port;
    }

    get url(): string {
        return `${this.port % 443 === 0 ? "https://" : "http://"}${this.ip}:${this.port}`;
    }

    public isVerified(): boolean {
        return this.verificationResult instanceof PeerVerificationResult;
    }

    public isForked(): boolean {
        return !!(this.isVerified() && this.verificationResult && this.verificationResult.forked);
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
