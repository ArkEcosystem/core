import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";
import semver from "semver";
import { SCClientSocket } from "socketcluster-client";
import { config as localConfig } from "./config";
import { SocketErrors } from "./enums";

export class PeerGuard implements P2P.IPeerGuard {
    private readonly offences: Record<string, P2P.IOffence> = {
        noCommonBlocks: {
            number: 5,
            period: "addMinutes",
            reason: "No Common Blocks",
            weight: 1,
            critical: true,
        },
        invalidVersion: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Version",
            weight: 2,
        },
        invalidNetwork: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Network",
            weight: 5,
            critical: true,
        },
        invalidStatus: {
            number: 5,
            period: "addMinutes",
            reason: "Invalid Response Status",
            weight: 3,
        },
        timeout: {
            number: 30,
            period: "addSeconds",
            reason: "Timeout",
            weight: 2,
        },
        highLatency: {
            number: 1,
            period: "addMinutes",
            reason: "High Latency",
            weight: 1,
        },
        applicationNotReady: {
            number: 30,
            period: "addSeconds",
            reason: "Application is not ready",
            weight: 0,
        },
        failedBlocksDownload: {
            number: 30,
            period: "addSeconds",
            reason: "Failed to download blocks",
            weight: 0,
        },
        tooManyRequests: {
            number: 60,
            period: "addSeconds",
            reason: "Rate limit exceeded",
            weight: 0,
        },
        fork: {
            number: 15,
            period: "addMinutes",
            reason: "Fork",
            weight: 10,
        },
        socketNotOpen: {
            number: 5,
            period: "addMinutes",
            reason: "Socket not open",
            weight: 3,
        },
        unknown: {
            number: 10,
            period: "addMinutes",
            reason: "Unknown",
            weight: 5,
        },
    };

    constructor(private readonly connector: P2P.IPeerConnector) {}

    public punishment(offence: string): P2P.IPunishment {
        return this.createPunishment(this.offences[offence]);
    }

    public analyze(peer: P2P.IPeer): P2P.IPunishment {
        if (app.has("state")) {
            const state = app.resolve("state");

            if (state.forkedBlock && peer.ip === state.forkedBlock.ip) {
                return this.createPunishment(this.offences.fork);
            }
        }

        if (peer.commonBlocks === false) {
            delete peer.commonBlocks;

            return this.createPunishment(this.offences.noCommonBlocks);
        }

        const connection: SCClientSocket = this.connector.connection(peer);

        if (connection && connection.getState() !== connection.OPEN) {
            return this.createPunishment(this.offences.socketNotOpen);
        }

        if (peer.socketError === SocketErrors.AppNotReady) {
            return this.createPunishment(this.offences.applicationNotReady);
        }

        if (peer.delay === -1) {
            return this.createPunishment(this.offences.timeout);
        }

        if (peer.delay > 2000) {
            return this.createPunishment(this.offences.highLatency);
        }

        if (!this.isValidNetwork(peer)) {
            return this.createPunishment(this.offences.invalidNetwork);
        }

        if (!this.isValidVersion(peer)) {
            return this.createPunishment(this.offences.invalidVersion);
        }

        return null;

        // @TODO: review and check if we keep it or not
        // return this.createPunishment(this.offences.unknown);
    }

    public isWhitelisted(peer: P2P.IPeer): boolean {
        return localConfig.get("whitelist", []).includes(peer.ip);
    }

    public isValidVersion(peer: P2P.IPeer): boolean {
        const version: string = (peer.version || (peer.headers && peer.headers.version)) as string;

        if (!semver.valid(version)) {
            return false;
        }

        return localConfig
            .get("minimumVersions", [])
            .some((minimumVersion: string) => semver.satisfies(version, minimumVersion));
    }

    public isValidNetwork(peer: P2P.IPeer): boolean {
        const nethash = peer.nethash || (peer.headers && peer.headers.nethash);

        return nethash === app.getConfig().get("network.nethash");
    }

    public isValidPort(peer: P2P.IPeer): boolean {
        return peer.port === localConfig.get("port");
    }

    private createPunishment(offence: P2P.IOffence): P2P.IPunishment {
        return {
            until: dato()[offence.period](offence.number),
            reason: offence.reason,
            weight: offence.weight,
            critical: offence.critical,
        };
    }
}
